import { State } from "../state";
import { System } from "../System";
import { IsActiveTag } from "../components";

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
