import { System } from "../System";
import { Camera, OrthographicCamera, Vector3 } from "three";
import { CameraState, RendererState, SceneState } from "../state";
import { VIEWPORT_SIZE } from "../constants";

// TODO light system

const initialTarget = new Vector3();

export interface ICameraController {
  position: Vector3;
}

function positionCamera(camera: Camera, controller: ICameraController) {
  const { position } = controller;
  camera.position.set(position.x, position.y - 8_000, position.z + 10_000);
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

  camera.zoom = 2;
  camera.updateProjectionMatrix();
  camera.updateMatrix();
  positionCamera(camera, {
    position: initialTarget
  });

  return camera;
}

type State = CameraState & RendererState & SceneState;

const MAX_ZOOM = 8;

class ZoomControl {
  #domElement: HTMLElement | null = null;
  #zoom = 1;

  set domElement(domElement: HTMLElement) {
    domElement.style.touchAction = "none";
    domElement.addEventListener("wheel", this.handleWheel, {
      passive: false,
      capture: true
    });
    this.#domElement = domElement;
  }

  set zoom(zoom: number) {
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
    domElement.removeEventListener("wheel", this.handleWheel);
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
    zoomControl.onChange = (zoom) => state.cameraZoomObservable.next(zoom);

    this.resources.push(
      state.cameraZoomObservable.subscribe((zoom) => {
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
        camera.updateMatrix();
        state.forceRender = true;
      })
    );
  }
  update(state: State): void {
    const camera = state.camera;
    const controller = state.cameraController;
    if (controller) {
      positionCamera(camera, controller);
    }
  }
  stop() {
    this.#zoomControl.dispose();
  }
}
