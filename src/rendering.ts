import {Vector2, WebGLRenderer} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
/**
* @class NullComposer
* A drop in replacement for the Three.js EffectComposer that does nothing.
*/
export class NullComposer extends EffectComposer {
  constructor() {
    super(new NullRenderer());
  }
  render = () => {};
  setSize = () => {};
  getSize = () => ({ width: 0, height: 0 });
  getPixelRatio = () => 1;
  domElement = null as unknown as HTMLCanvasElement;
}

export class NullRenderer extends WebGLRenderer {
  render = () => {
  };
  setSize = () => {
  };
  getSize = () => {
    return new Vector2();
  }
  getPixelRatio = () => 1;
  domElement = null as unknown as HTMLCanvasElement;
}

