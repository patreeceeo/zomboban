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
import { createRouterSystem } from "./RouterSystem";

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
  update(context: Context) {
    switch (context.metaStatus) {
      case MetaStatus.Restart:
        {
          context.resetWorld(this.#gameEntities);
          this.mgr.clear();
          this.mgr.push(createRouterSystem(ROUTES, context.currentRoute));
        }
        break;
      case MetaStatus.Win: {
        this.mgr.clear();
        winMessageElement.style.display = "block";
      }
    }
    context.metaStatus = MetaStatus.Play;
  }
  stop() {
    for (const entity of this.#gameEntities!) {
      IsActiveTag.remove(entity);
    }
  }
}
