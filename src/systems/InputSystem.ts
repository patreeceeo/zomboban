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
import {isPixelPass} from "../state/render";
import {Multimap} from "../collections/Multimap";

type InputHandler<TState> = (state: TState) => void;

export class KeyMapping<TState> extends Multimap<KeyCombo, InputHandler<TState>> {}

// Needs to access a lot of state indirectly because of the keyMappings
export class InputSystem extends SystemWithQueries<State> {
  start(state: State) {
    window.onkeydown = (event) => this.handleKeyDown(event, state);
    window.onkeyup = (event) => this.handleKeyUp(event, state);
    window.onblur = () => this.handleBlur(state);
    window.onpointerout = () => this.handleBlur(state);
    window.onpointerdown = (event) => this.handleMouseDown(state, event);
    window.onpointermove = (event) => this.handleMouseMove(state, event);
    window.onpointerup = () => this.handleMouseUp(state);
    window.onwheel = (event) => this.handleWheel(event, state);

    state.render.canvas.style.touchAction = "none";

    this.resources.push(
      // Listen for camera changes
      state.render.streamCameras((camera) => {
        this.setupZoomControl(state, camera);
      }),
    );
  }
  handleKeyDown(e: KeyboardEvent, state: State) {
    const input = parseEventKey(e);
    if (input === undefined) {
      return;
    }
    state.input.pressed = combineKeys(state.input.pressed, input);
    state.input.keys.push(state.input.pressed);
  }
  handleMouseUp(state: State) {
    state.input.pressed = removeKey(state.input.pressed, Key.Pointer1);
  }
  handleMouseDown(state: State, event: MouseEvent) {
    if(event.target !== state.render.canvas) return;
    state.input.pressed = combineKeys(state.input.pressed, Key.Pointer1);
    this.handleMouseMove(state, event);
  }
  handleMouseMove(state: State, event: MouseEvent) {
    state.input.keys.push(state.input.pressed);

    const {canvas} = state.render;
    const canvasBounds = canvas.getBoundingClientRect();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    state.input.pointerPosition.set(
      event.clientX - canvasBounds.left - width / 2,
      event.clientY - canvasBounds.top - height / 2,
    );
  }
  handleKeyUp(e: KeyboardEvent, state: State) {
    const input = parseEventKey(e);
    if (input === undefined) {
      return;
    }
    state.input.pressed = removeKey(state.input.pressed, input);
  }
  handleBlur(state: State) {
    state.input.pressed = 0 as KeyCombo;
  }
  private setupZoomControl(state: State, camera: OrthographicCamera) {
    let pixelatedPass: RenderPixelatedPass | undefined;
    for(const pass of state.render.composer.passes) {
      if(isPixelPass(pass)) {
        pixelatedPass = pass;
        break;
      }
    }
    state.zoomControl = new ZoomControl(camera, pixelatedPass);
  }

  handleWheel(event: WheelEvent, state: State) {
    event.preventDefault();
    state.zoomControl.handleZoomDelta(event.deltaY);
  }

  update(state: State) {
    if (process.env.NODE_ENV === "development") {
      if (state.input.pressed) {
        state.$currentInputFeedback = `input: ${keyComboToString(
          state.input.pressed
        )}`;
      } else {
        state.$currentInputFeedback = "";
      }
    }
    const { keyMapping } = state.input;
    const newInput = state.input.keys[0];
    for(const handler of keyMapping.getWithDefault(newInput)) {
      handler(state);
    }

    state.input.keys.length = 0;
  }

  stop(state: State) {
    state.render.canvas.style.touchAction = "";
  }
}
