import { IsActiveTag, IsGameEntityTag } from "../components";
import { deserializeEntity } from "../functions/Networking";
import { DEFAULT_ROUTE, ROUTES } from "../routes";
import {
  ActionsState,
  EditorState,
  EntityManagerState,
  GameState,
  GameStatus,
  QueryState
} from "../state";
import { SystemWithQueries } from "../System";
import { createRouterSystem } from "./RouterSystem";

type Context = QueryState &
  EditorState &
  GameState &
  EntityManagerState &
  ActionsState;

declare const winMessageElement: HTMLElement;

export class GameSystem extends SystemWithQueries<QueryState> {
  #gameEntities = this.createQuery([IsGameEntityTag]);
  start(context: Context) {
    this.#gameEntities.stream((entity) => IsActiveTag.add(entity));
    this.#gameEntities.onRemove((entity) => IsActiveTag.remove(entity));
    context.editorCursor.transform.visible = false;
  }
  update(context: Context) {
    switch (context.gameStatus) {
      case GameStatus.Restart:
        {
          for (const entity of this.#gameEntities) {
            context.removeEntity(entity);
          }
          for (const data of context.originalWorld) {
            const entity = context.addEntity();
            deserializeEntity(entity, data);
          }
          this.mgr.clear();
          this.mgr.push(createRouterSystem(ROUTES, DEFAULT_ROUTE));
        }
        break;
      case GameStatus.Win: {
        this.mgr.clear();
        winMessageElement.style.display = "block";
      }
    }
    context.gameStatus = GameStatus.Play;
  }
  stop() {
    for (const entity of this.#gameEntities!) {
      IsActiveTag.remove(entity);
    }
  }
}
