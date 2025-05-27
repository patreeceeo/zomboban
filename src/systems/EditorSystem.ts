import {
  EntityPrefabEnum,
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
  MetaStatus,
  State
} from "../state";
import { handleRestart } from "../inputs";
import {EditorCommand } from "../editor_commands";
import {isClient} from "../util";

export interface IEditorState {
  editor: {
    commandQueue: EditorCommand<any, any>[];
    undoStack: EditorCommand<any, any>[];
  }
}

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

  static undo(state: State) {
    const { editor: { undoStack } } = state;
    if (undoStack.length === 0) return;

    const command = undoStack.pop()!;
    command.undoCommand.execute();
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
    const { editor: {commandQueue, undoStack} } = context;
    while (commandQueue.length > 0) {
      const command = commandQueue.shift()!;
      command.state = context;
      command.execute().then(() => {
        undoStack.push(command);
      }).catch((error) => {
        console.error("Command execution failed:", error);
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
