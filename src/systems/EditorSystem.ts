import { System } from "../System";
import { IsActiveTag } from "../components";
import { EditorCursorState } from "../state";

type State = EditorCursorState;

export class EditorSystem extends System<State> {
  start(state: State) {
    IsActiveTag.add(state.editorCursor);
    state.editorCursor.visible = true;
  }
  stop(state: State) {
    IsActiveTag.remove(state.editorCursor);
    state.editorCursor.visible = false;
  }
}
