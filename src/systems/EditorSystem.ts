import {
  EntityPrefabEnum,
  IEntityPrefabState,
  bindEntityPrefabs
} from "../entities";
import { SystemWithQueries } from "../System";
import {
  BehaviorComponent,
  CursorTag,
  IsActiveTag,
  IsGameEntityTag,
  TransformComponent
} from "../components";
import {
  ActionsState,
  EntityManagerState,
  LoadingState,
  MetaState,
  MetaStatus,
  QueryState,
  RouterState
} from "../state";
import { handleRestart } from "../inputs";
import {EditorCommand, EditorCommandStatus} from "../editor_commands";
import {isClient} from "../util";

export interface IEditorState {
  editor: {
    commandQueue: EditorCommand<any, any>[];
    commandHistory: EditorCommand<any, any>[];
  }
}

type State = IEditorState &
  QueryState &
  MetaState &
  EntityManagerState &
  LoadingState &
  IEntityPrefabState &
  RouterState &
  ActionsState;

export class EditorSystem extends SystemWithQueries<State> {
  #gameNtts = this.createQuery([IsGameEntityTag]);
  #cursorNtts = this.createQuery([
    CursorTag,
    TransformComponent,
    BehaviorComponent
  ]);

  static addCommand(
    state: State,
    command: EditorCommand<any, any>
  ) {
    state.editor.commandQueue.push(command);
  }

  async start(state: State) {
    const { entityPrefabMap } = state;

    this.resources.push(
      this.#cursorNtts.stream((entity) => {
        IsActiveTag.add(entity);
        entity.transform.visible = true;
      }),
      this.#gameNtts.stream((ent) => {
        IsActiveTag.remove(ent);
      })
    );

    handleRestart(state);

    await bindEntityPrefabs(state);

    if (isClient && this.#cursorNtts.size === 0) {
      const Cursor = entityPrefabMap.get(EntityPrefabEnum.Cursor)!;
      Cursor.create(state);
    }

    state.metaStatus = MetaStatus.Edit;
  }
  update(context: State): void {
    // Process command queue
    const { editor: {commandQueue, commandHistory } } = context;
    while (commandQueue.length > 0) {
      const command = commandQueue.shift()!;
      command.state = context;
      command.status = EditorCommandStatus.Pending;
      commandHistory.push(command);
      command.execute().then(() => {
        command.status = EditorCommandStatus.Completed;
      }).catch((error) => {
        console.error("Command execution failed:", error);
        command.status = EditorCommandStatus.Failed;
      });
    }
  }
  stop() {
    for (const entity of this.#cursorNtts) {
      IsActiveTag.remove(entity);
      entity.transform.visible = false;
    }
  }
}
