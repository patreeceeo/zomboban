import { Scene, OrthographicCamera, Vector3, WebGLRenderer, Vector2 } from "three";
import { EffectComposer, Pass } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPixelatedPass } from "three/examples/jsm/postprocessing/RenderPixelatedPass.js";
import { ObservableValue } from "../Observable";
import { invariant } from "../Error";
import { VIEWPORT_SIZE } from "../constants";

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

/**
* @class NullComposer
* A drop in replacement for the Three.js EffectComposer that does nothing.
*/
export class NullComposer extends EffectComposer {
  constructor() {
    super(new NullRenderer() as unknown as WebGLRenderer);
  }
  render = () => {};
  setSize = () => {};
  getSize = () => ({ width: 0, height: 0 });
  getPixelRatio = () => 1;
  domElement = null as unknown as HTMLCanvasElement;
}

export class NullRenderer {
  render = () => {
  };
  setSize = () => {
  };
  getSize = () => {
    return new Vector2();
  }
  getPixelRatio = () => 1;
  domElement = null as unknown as HTMLCanvasElement;
  isNullRenderer = true;
}

export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    precision: "lowp",
    powerPreference: "low-power"
  });
  renderer.setSize(VIEWPORT_SIZE.x, VIEWPORT_SIZE.y);
  // We want these to be set with CSS
  Object.assign(canvas.style, {
    width: "",
    height: ""
  });

  return renderer;
}

export function createEffectComposer(
  renderer: WebGLRenderer | NullRenderer,
  scene: Scene,
  camera: OrthographicCamera
) {
  if(isNullRenderer(renderer)) {
    return new NullComposer();
  }
  const composer = new EffectComposer(renderer);
  const pixelatedPass = new RenderPixelatedPass(2, scene, camera, {
    depthEdgeStrength: -0.5,
    normalEdgeStrength: -1
  });
  composer.addPass(pixelatedPass);

  return composer;
}

function isNullRenderer(renderer: any): renderer is NullRenderer {
  return renderer && renderer.isNullRenderer;
}

export function isPixelPass(pass: Pass): pass is RenderPixelatedPass {
  return "setPixelSize" in pass && "setEdgeStrengths" in pass;
}