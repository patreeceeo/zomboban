import { SystemWithQueries } from "../System";
import { IsActiveTag, IsGameEntityTag } from "../components";
import { ROUTES } from "../routes";
import {
  EditorState,
  EntityManagerState,
  GameState,
  MetaStatus,
  QueryState,
  RouterState
} from "../state";
import { createRouterSystem } from "./RouterSystem";

type State = EditorState &
  QueryState &
  GameState &
  EntityManagerState &
  RouterState;

export class EditorSystem extends SystemWithQueries<State> {
  #gameNtts = this.createQuery([IsGameEntityTag]);
  start(state: State) {
    IsActiveTag.add(state.editorCursor);
    state.editorCursor.transform.visible = true;
    this.resources.push(
      this.#gameNtts.stream((ent) => {
        IsActiveTag.remove(ent);
      })
    );
  }
  update(context: State): void {
    switch (context.metaStatus) {
      case MetaStatus.Restart:
        {
          context.resetWorld(this.#gameNtts);
          this.mgr.clear();
          this.mgr.push(createRouterSystem(ROUTES, context.currentRoute));
        }
        break;
    }
    context.metaStatus = MetaStatus.Play;
  }
  stop(state: State) {
    IsActiveTag.remove(state.editorCursor);
    state.editorCursor.transform.visible = false;
  }
}
