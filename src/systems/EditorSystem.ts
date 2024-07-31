import { SystemWithQueries } from "../System";
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
import { createRouterSystem } from "./RouterSystem";

type State = EditorState &
  QueryState &
  MetaState &
  EntityManagerState &
  RouterState &
  MetaState;

export class EditorSystem extends SystemWithQueries<State> {
  #gameNtts = this.createQuery([IsGameEntityTag]);
  start(state: State) {
    IsActiveTag.add(state.editorCursor);
    state.editorCursor.transform.visible = true;
    state.metaStatus = MetaStatus.Edit;
    this.resources.push(
      this.#gameNtts.stream((ent) => {
        IsActiveTag.remove(ent);
      })
    );
  }
  update(context: State): void {
    // TODO this should be handled by a higher-level system
    switch (context.metaStatus) {
      case MetaStatus.Restart:
        {
          context.clearWorld();
          this.mgr.clear();
          this.mgr.push(createRouterSystem(ROUTES));
          context.addAllEntities(context.originalWorld);
        }
        break;
    }
  }
  stop(state: State) {
    IsActiveTag.remove(state.editorCursor);
    state.editorCursor.transform.visible = false;
  }
}
