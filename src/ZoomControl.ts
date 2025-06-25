import { OrthographicCamera } from "./Three";
import { MAX_ZOOM } from "./constants";
import { RenderPixelatedPass } from "three/examples/jsm/Addons.js";

export class ZoomControl {
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
    this.#zoom = Math.max(1, Math.min(zoom, MAX_ZOOM));
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
      this.#pixelatedPass.setPixelSize(Math.min(4, this.#zoom));
    }
  }

  handleZoomDelta(deltaY: number) {
    this.zoom += Math.round(deltaY / 100);
  }
}