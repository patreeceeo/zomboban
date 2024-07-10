import {
  Key,
  KeyCombo,
  combineKeys,
  keyComboToString,
  parseEventKey,
  removeKey
} from "../Input";
import { System } from "../System";
import { removeElementByIdSafely } from "../UIElement";
import {
  ActionsState,
  InputState,
  MetaState,
  RouterState,
  TimeState
} from "../state";

export class KeyMapping<State> extends Map<
  KeyCombo | Key,
  (state: State) => void
> {}

// Needs to access a lot of state indirectly because of the keyMappings
type Context = InputState & RouterState & ActionsState & MetaState & TimeState;
declare const showCurrentInputElement: HTMLElement;
export class InputSystem extends System<Context> {
  start(state: Context) {
    window.onkeydown = (event) => this.handleKeyDown(event, state);
    window.onkeyup = (event) => this.handleKeyUp(event, state);
    window.onblur = () => this.handleBlur(state);
    window.onmouseout = () => this.handleBlur(state);
    window.onmousedown = () => this.handleMouseDown(state);
    window.onmouseup = () => this.handleMouseUp(state);

    if (process.env.NODE_ENV !== "development") {
      removeElementByIdSafely("showCurrentInputElement");
    }
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
  handleMouseUp(state: Context) {
    state.inputPressed = removeKey(state.inputPressed, Key.Mouse1);
    state.inputRepeating = removeKey(state.inputRepeating, Key.Mouse1);
  }
  handleMouseDown(state: Context) {
    state.inputPressed = combineKeys(state.inputPressed, Key.Mouse1);
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
  update(state: Context) {
    if (process.env.NODE_ENV === "development") {
      if (state.inputPressed) {
        showCurrentInputElement.innerText = `input: ${keyComboToString(state.inputPressed)}`;
      } else {
        showCurrentInputElement.innerText = "";
      }
    }
    const { keyMapping } = state;
    const newInput = state.inputs[0];
    if (keyMapping.has(newInput)) {
      keyMapping.get(newInput)!(state);
    }

    state.inputs.length = 0;
  }
}
