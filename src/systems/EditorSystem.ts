import {
  EntityPrefabEnum,
  bindEntityPrefabs
} from "../entities";
import { SystemWithQueries } from "../System";
import {
  IsActiveTag,
  IsGameEntityTag
} from "../components";
import {
  Mode,
  State
} from "../state";
import { handleRestart } from "../inputs";
import {EditorCommand } from "../editor_commands";
import {isClient} from "../util";

export class EditorSystem extends SystemWithQueries<State> {
  #gameNtts = this.createQuery([IsGameEntityTag]);

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
    command.undoCommand.execute().then(() => {
      state.editor.redoStack.push(command);
    });
  }

  static redo(state: State) {
    const { editor: { redoStack } } = state;
    if (redoStack.length === 0) return;

    const command = redoStack.pop()!;
    command.execute();
  }

  async start(state: State) {
    const { entityPrefabMap } = state;

    this.resources.push(
      state.cursorEntities.stream((entity) => {
        IsActiveTag.add(entity);
        entity.transform.visible = true;
      }),
      this.#gameNtts.stream((ent) => {
        IsActiveTag.remove(ent);
      })
    );

    await handleRestart(state);

    await bindEntityPrefabs(state);

    if (isClient && state.cursorEntities.size === 0) {
      const Cursor = entityPrefabMap.get(EntityPrefabEnum.Cursor)!;
      Cursor.create(state.world);
    }

    state.mode = Mode.Edit;
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
  stop(state: State) {
    for (const entity of state.cursorEntities) {
      IsActiveTag.remove(entity);
      entity.transform.visible = false;
    }
  }
}
