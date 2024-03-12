import { KeyCombo, combineKeys, parseEventKey, removeKey } from "../Input";
import { System } from "../System";
import { InputState, TimeState } from "../state";

type Context = InputState & TimeState;
export class InputSystem extends System<Context> {
  start(state: Context) {
    window.onkeydown = (event) => this.handleKeyDown(event, state);
    window.onkeyup = (event) => this.handleKeyUp(event, state);
    window.onblur = () => this.handleBlur(state);
    window.onmouseout = () => this.handleBlur(state);
  }
  handleKeyDown(e: KeyboardEvent, state: Context) {
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
  handleKeyUp(e: KeyboardEvent, state: Context) {
    const input = parseEventKey(e);
    if (input === undefined) {
      return;
    }
    state.inputPressed = removeKey(state.inputPressed, input);
    state.inputRepeating = removeKey(state.inputRepeating, input);
  }
  handleBlur(state: Context) {
    state.inputPressed = 0 as KeyCombo;
    state.inputRepeating = 0 as KeyCombo;
  }
}
