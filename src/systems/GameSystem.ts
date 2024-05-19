import { IsActiveTag, IsGameEntityTag } from "../components";
import { deserializeEntity } from "../functions/Networking";
import { DEFAULT_ROUTE, ROUTES } from "../routes";
import {
  ActionsState,
  EditorState,
  EntityManagerState,
  GameState,
  QueryState
} from "../state";
import { SystemWithQueries } from "../System";
import { createRouterSystem } from "./RouterSystem";

type Context = QueryState &
  EditorState &
  GameState &
  EntityManagerState &
  ActionsState;

export class GameSystem extends SystemWithQueries<QueryState> {
  #gameEntities = this.createQuery([IsGameEntityTag]);
  start(context: Context) {
    this.#gameEntities.stream((entity) => IsActiveTag.add(entity));
    this.#gameEntities.onRemove((entity) => IsActiveTag.remove(entity));
    context.editorCursor.transform.visible = false;
  }
  update(context: Context) {
    if (context.isGameRestarting) {
      for (const entity of this.#gameEntities) {
        context.removeEntity(entity);
      }
      for (const data of context.originalWorld) {
        const entity = context.addEntity();
        deserializeEntity(entity, data);
      }
      this.mgr.clear();
      this.mgr.push(createRouterSystem(ROUTES, DEFAULT_ROUTE));
      context.isGameRestarting = false;
    }
  }
  stop() {
    for (const entity of this.#gameEntities!) {
      IsActiveTag.remove(entity);
    }
  }
}
