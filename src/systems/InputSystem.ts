import {
  Key,
  KeyCombo,
  combineKeys,
  keyComboToString,
  parseEventKey,
  removeKey
} from "../Input";
import { SystemWithQueries } from "../System";
import { State } from "../state";
import { RenderPixelatedPass } from "three/examples/jsm/Addons.js";
import { ZoomControl } from "../ZoomControl";
import {OrthographicCamera} from "three";
import {isPixelPass} from "../rendering";

declare const canvas: HTMLCanvasElement;

export class KeyMapping<State> extends Map<
  KeyCombo | Key,
  (state: State) => void
> {}

// Needs to access a lot of state indirectly because of the keyMappings
type Context = State;
export class InputSystem extends SystemWithQueries<Context> {
  start(state: Context) {
    window.onkeydown = (event) => this.handleKeyDown(event, state);
    window.onkeyup = (event) => this.handleKeyUp(event, state);
    window.onblur = () => this.handleBlur(state);
    window.onpointerout = () => this.handleBlur(state);
    window.onpointerdown = (event) => this.handleMouseDown(state, event);
    window.onpointermove = (event) => this.handleMouseMove(state, event);
    window.onpointerup = () => this.handleMouseUp(state);
    window.onwheel = (event) => this.handleWheel(event, state);

    state.renderer.domElement.style.touchAction = "none";

    this.resources.push(
      // Listen for camera changes
      state.streamCameras((camera) => {
        this.setupZoomControl(state, camera);
      }),
    );
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
  private setupZoomControl(state: Context, camera: OrthographicCamera) {
    let pixelatedPass: RenderPixelatedPass | undefined;
    for(const pass of state.composer.passes) {
      if(isPixelPass(pass)) {
        pixelatedPass = pass;
        break;
      }
    }
    state.zoomControl = new ZoomControl(camera, pixelatedPass);
  }

  handleWheel(event: WheelEvent, state: Context) {
    event.preventDefault();
    state.zoomControl.handleZoomDelta(event.deltaY);
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

  stop(state: Context) {
    state.renderer.domElement.style.touchAction = "";
  }
}
