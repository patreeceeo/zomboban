import { System } from "../System";
import { Camera, OrthographicCamera, Vector3 } from "three";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { CameraState, RendererState } from "../state";

const initialTarget = new Vector3();

function positionCamera(camera: Camera, target: Vector3) {
  camera.position.set(target.x, target.y - 250, target.z + 595);
  camera.lookAt(target);
}

export function createCamera() {
  const offsetWidth = SCREENX_PX;
  const offsetHeight = SCREENY_PX;
  const camera = new OrthographicCamera(
    offsetWidth / -2,
    offsetWidth / 2,
    offsetHeight / 2,
    offsetHeight / -2,
    100,
    100000
  );

  camera.updateProjectionMatrix();
  camera.updateMatrix();
  positionCamera(camera, initialTarget);
  return camera;
}

type State = CameraState & RendererState;

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
    zoomControl.onChange = (zoom) => {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      camera.updateMatrix();
      state.cameraZoomObservable.next(zoom);
    };
  }
  update(state: State): void {
    const camera = state.camera;
    const target = state.cameraController?.position;
    if (target) {
      positionCamera(camera, target);
    }
  }
  stop() {
    this.#zoomControl.dispose();
  }
}
