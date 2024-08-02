import { SystemWithQueries } from "../System";
import { IsActiveTag, IsGameEntityTag } from "../components";
import {
  EditorState,
  EntityManagerState,
  MetaState,
  MetaStatus,
  QueryState,
  RouterState
} from "../state";

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
  stop(state: State) {
    IsActiveTag.remove(state.editorCursor);
    state.editorCursor.transform.visible = false;
  }
}
