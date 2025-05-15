import {
  Key,
  KeyCombo,
  combineKeys,
  keyComboToString,
  parseEventKey,
  removeKey
} from "../Input";
import { System } from "../System";
import {
  ActionsState,
  ClientState,
  EntityManagerState,
  InputState,
  MetaState,
  RouterState,
  TimeState
} from "../state";

declare const canvas: HTMLCanvasElement;

export class KeyMapping<State> extends Map<
  KeyCombo | Key,
  (state: State) => void
> {}

// Needs to access a lot of state indirectly because of the keyMappings
type Context = InputState &
  RouterState &
  ActionsState &
  MetaState &
  TimeState &
  EntityManagerState &
  ClientState;
export class InputSystem extends System<Context> {
  start(state: Context) {
    window.onkeydown = (event) => this.handleKeyDown(event, state);
    window.onkeyup = (event) => this.handleKeyUp(event, state);
    window.onblur = () => this.handleBlur(state);
    window.onpointerout = () => this.handleBlur(state);
    window.onpointerdown = (event) => this.handleMouseDown(state, event);
    window.onpointermove = (event) => this.handleMouseMove(state, event);
    window.onpointerup = () => this.handleMouseUp(state);
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
    state.inputPressed = removeKey(state.inputPressed, Key.Pointer1);
    state.inputRepeating = removeKey(state.inputRepeating, Key.Pointer1);
  }
  handleMouseDown(state: Context, event: MouseEvent) {
    if(event.target !== canvas) return;
    state.inputPressed = combineKeys(state.inputPressed, Key.Pointer1);
    this.handleMouseMove(state, event);
  }
  handleMouseMove(state: Context, event: MouseEvent) {
    state.inputs.push(state.inputPressed);
    state.inputDt = state.time - state.inputTime;
    state.inputTime = state.time;

    const canvasBounds = canvas.getBoundingClientRect();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    state.pointerPosition.set(
      event.clientX - canvasBounds.left - width / 2,
      event.clientY - canvasBounds.top - height / 2,
    );
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
        state.$currentInputFeedback = `input: ${keyComboToString(
          state.inputPressed
        )}`;
      } else {
        state.$currentInputFeedback = "";
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
