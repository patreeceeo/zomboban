import { SystemWithQueries } from "../System";
import { IsActiveTag, IsGameEntityTag } from "../components";
import { EditorState, QueryState } from "../state";

type State = EditorState & QueryState;

export class EditorSystem extends SystemWithQueries<State> {
  #gameEnts = this.createQuery([IsGameEntityTag]);
  start(state: State) {
    IsActiveTag.add(state.editorCursor);
    state.editorCursor.transform.visible = true;
    this.resources.push(
      this.#gameEnts.stream((ent) => {
        IsActiveTag.remove(ent);
      })
    );
  }
  stop(state: State) {
    IsActiveTag.remove(state.editorCursor);
    state.editorCursor.transform.visible = false;
  }
}
