import { OrthographicCamera } from "three";
import { MAX_ZOOM } from "./constants";
import { RenderPixelatedPass } from "three/examples/jsm/Addons.js";
import {minMax} from "./util";

export interface IZoomControl {
  zoom: number;
  handleZoomDelta(deltaY: number): void;
}

export class ZoomControl implements IZoomControl {
  #zoom = 1;
  #camera: OrthographicCamera;
  #pixelatedPass?: RenderPixelatedPass;

  constructor(camera: OrthographicCamera, pixelatedPass?: RenderPixelatedPass) {
    this.#camera = camera;
    this.#pixelatedPass = pixelatedPass;
    this.zoom = camera.zoom;
  }

  set zoom(zoom: number) {
    if(zoom === this.#zoom) return;
    this.#zoom = minMax(zoom, 1, MAX_ZOOM)
    this.updateCamera();
  }

  get zoom() {
    return this.#zoom;
  }

  private updateCamera() {
    this.#camera.zoom = this.#zoom;
    this.#camera.updateProjectionMatrix();
    this.#camera.updateMatrix();
    
    if (this.#pixelatedPass) {
      this.#pixelatedPass.setPixelSize(minMax(this.#zoom, 1, 4));
    }
  }

  handleZoomDelta(deltaY: number) {
    this.zoom += Math.round(deltaY / 100);
  }
}

export class NullZoomControl implements IZoomControl {
  zoom = 1;

  handleZoomDelta() {
    // No-op
  }
}
