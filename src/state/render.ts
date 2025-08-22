import { Scene, OrthographicCamera, Vector3, WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { ObservableValue } from "../Observable";
import { invariant } from "../Error";
import { createRenderer, NullComposer, NullRenderer } from "../rendering";

export class RenderState {
  #canvas = undefined as HTMLCanvasElement | undefined;
  
  set canvas(canvas: HTMLCanvasElement) {
    this.#canvas = canvas;
    this.renderer = createRenderer(canvas);
  }
  
  get canvas() {
    invariant(this.#canvas !== undefined, "Expected canvas to have been set");
    return this.#canvas;
  }
  
  renderer = new NullRenderer() as NullRenderer | WebGLRenderer;
  #scene = new Scene();
  
  get scene() {
    return this.#scene!;
  }
  
  composer = new NullComposer() as EffectComposer;
  #cameraObservable = new ObservableValue<OrthographicCamera | undefined>(undefined);
  
  get camera() {
    return this.#cameraObservable.get();
  }
  
  set camera(camera: OrthographicCamera | undefined) {
    this.#cameraObservable.set(camera);
  }
  
  streamCameras(callback: (camera: OrthographicCamera) => void) {
    return this.#cameraObservable.stream((camera) => {
      if (camera) {
        callback(camera);
      }
    });
  }
  
  cameraTarget = new Vector3();
  cameraOffset = new Vector3();
  lookAtTarget = true;
}