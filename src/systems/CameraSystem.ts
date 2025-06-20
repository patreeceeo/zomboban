import { System } from "../System";
import { Camera, OrthographicCamera, Vector3 } from "../Three";
import { CameraState, RendererState, SceneState } from "../state";
import { MAX_ZOOM, VIEWPORT_SIZE } from "../constants";
import { RenderPixelatedPass } from "three/examples/jsm/Addons.js";

// TODO light system

const initialTarget = new Vector3();

export interface ICameraController {
  position: Vector3;
}

function positionCamera(camera: Camera, controller: ICameraController) {
  const { position } = controller;
  camera.position.set(position.x, position.y - 4_500, position.z + 10_000);
  camera.lookAt(position);
}

export function createOrthographicCamera() {
  const offsetWidth = VIEWPORT_SIZE.x;
  const offsetHeight = VIEWPORT_SIZE.y;
  const camera = new OrthographicCamera(
    offsetWidth / -2,
    offsetWidth / 2,
    offsetHeight / 2,
    offsetHeight / -2,
    100,
    100000
  );

  camera.zoom = 1;
  camera.updateProjectionMatrix();
  camera.updateMatrix();
  positionCamera(camera, {
    position: initialTarget
  });

  return camera;
}

type State = CameraState & RendererState & SceneState;


class ZoomControl {
  #domElement: HTMLElement | null = null;
  #zoom = 1;

  set domElement(domElement: HTMLElement) {
    domElement.style.touchAction = "none";
    document.addEventListener("wheel", this.handleWheel, {
      passive: false,
      capture: true
    });
    this.#domElement = domElement;
  }

  set zoom(zoom: number) {
    if(zoom === this.#zoom) return;
    this.#zoom = Math.max(1, Math.min(zoom, MAX_ZOOM));
    this.onChange(this.#zoom);
  }

  get zoom() {
    return this.#zoom;
  }

  onChange: (zoom: number) => void = () => {};

  handleWheel = (event: WheelEvent) => {
    event.preventDefault();

    this.zoom += Math.round(event.deltaY / 100);
  };

  dispose() {
    const domElement = this.#domElement;
    if (!domElement) return;
    document.removeEventListener("wheel", this.handleWheel);
    domElement.style.touchAction = "";
    this.#domElement = null;
  }
}

export class CameraSystem extends System<State> {
  #zoomControl = new ZoomControl();
  start(state: State) {
    const { camera } = state;
    const zoomControl = this.#zoomControl;
    zoomControl.zoom = camera.zoom;
    zoomControl.domElement = state.renderer.domElement;
    zoomControl.onChange = (zoom) => {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      camera.updateMatrix();
      (state.composer.passes[0] as RenderPixelatedPass).setPixelSize(
        Math.min(4, zoom)
      );
    };
  }
  update(state: State): void {
    const camera = state.camera;
    const controller = state.cameraController;
    if (controller) {
      positionCamera(camera, controller);
    }
    this.#zoomControl.zoom = state.zoom;
  }
  stop() {
    this.#zoomControl.dispose();
  }
}
