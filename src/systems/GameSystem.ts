import { IsActiveTag, IsGameEntityTag } from "../components";
import { EditorCursorState, QueryState } from "../state";
import { SystemWithQueries } from "../System";

type Context = QueryState & EditorCursorState;

export class GameSystem extends SystemWithQueries<QueryState> {
  #gameEntities = this.createQuery([IsGameEntityTag]);
  start(context: Context) {
    this.#gameEntities.stream((entity) => IsActiveTag.add(entity));
    this.#gameEntities.onRemove((entity) => IsActiveTag.remove(entity));
    context.editorCursor.transform.visible = false;
  }
  stop() {
    for (const entity of this.#gameEntities!) {
      IsActiveTag.remove(entity);
    }
  }
}
