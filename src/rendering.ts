import {OrthographicCamera, Scene, Vector2, WebGLRenderer} from "three";
import { EffectComposer, Pass } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPixelatedPass } from "three/examples/jsm/postprocessing/RenderPixelatedPass.js";
import {isClient} from "./util";
import {invariant} from "./Error";
import {VIEWPORT_SIZE} from "./constants";

declare const canvas: HTMLCanvasElement;

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

export function createRenderer() {
  if(!isClient) {
    return new NullRenderer();
  }
  invariant(
    canvas instanceof HTMLCanvasElement,
    `Missing canvas element with id "canvas"`
  );
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
