import { IsActiveTag, IsGameEntityTag } from "../components";
import { ROUTES } from "../routes";
import {
  EditorState,
  EntityManagerState,
  MetaState,
  MetaStatus,
  QueryState,
  RouterState
} from "../state";
import { SystemWithQueries } from "../System";
import { delay } from "../util";
import { createRouterSystem, routeTo } from "./RouterSystem";

type Context = QueryState &
  EditorState &
  MetaState &
  EntityManagerState &
  RouterState;

declare const winMessageElement: HTMLElement;

export class GameSystem extends SystemWithQueries<QueryState> {
  #gameEntities = this.createQuery([IsGameEntityTag]);
  start(context: Context) {
    this.#gameEntities.stream((entity) => IsActiveTag.add(entity));
    this.#gameEntities.onRemove((entity) => IsActiveTag.remove(entity));
    context.editorCursor.transform.visible = false;
    context.metaStatus = MetaStatus.Play;
  }
  async update(context: Context) {
    // TODO this should be handled by a higher-level system
    switch (context.metaStatus) {
      case MetaStatus.Restart:
        {
          // TODO this is slow
          context.clearWorld();
          this.mgr.clear();
          this.mgr.push(createRouterSystem(ROUTES, context.currentRoute));
          context.addAllEntities(context.originalWorld);
        }
        break;
      case MetaStatus.Win:
        {
          winMessageElement.style.display = "block";
          await delay(2000);
          winMessageElement.style.display = "none";
          context.metaStatus = MetaStatus.Restart;
          await delay(100);
          routeTo("feedback");
        }
        break;
    }
    context.metaStatus = MetaStatus.Play;
  }
  stop() {
    for (const entity of this.#gameEntities!) {
      IsActiveTag.remove(entity);
    }
  }
}
