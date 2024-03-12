import { combineKeys, parseEventKey, removeKey } from "../Input";
import { System } from "../System";
import { State } from "../state";

export class InputSystem extends System<State> {
  start(state: State) {
    window.onkeydown = (event) => this.handleKeyDown(event, state);
    window.onkeyup = (event) => this.handleKeyUp(event, state);
  }
  handleKeyDown(e: KeyboardEvent, state: State) {
    const input = parseEventKey(e);
    if (input === undefined) {
      return;
    }
    state.inputPressed = combineKeys(state.inputPressed, input);
    if (e.repeat) {
      state.inputRepeating = combineKeys(state.inputRepeating, input);
    }
    state.inputs.push(state.inputPressed);
    state.inputDt = state.time - state.inputTime;
    state.inputTime = state.time;
  }
  handleKeyUp(e: KeyboardEvent, state: State) {
    const input = parseEventKey(e);
    if (input === undefined) {
      return;
    }
    state.inputPressed = removeKey(state.inputPressed, input);
    state.inputRepeating = removeKey(state.inputRepeating, input);
  }
}
