import { IsActiveTag, IsGameEntityTag } from "../components";
import {
  EditorState,
  EntityManagerState,
  MetaState,
  QueryState,
  RouterState
} from "../state";
import { SystemWithQueries } from "../System";

type Context = QueryState &
  EditorState &
  MetaState &
  EntityManagerState &
  RouterState;

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
