import { System } from "../System";
import {
  AmbientLight,
  Camera,
  DirectionalLight,
  OrthographicCamera,
  Vector3
} from "three";
import { CameraState, RendererState, SceneState } from "../state";
import { VIEWPORT_SIZE } from "../constants";

// TODO light system

const initialTarget = new Vector3();

function positionCamera(camera: Camera, target: Vector3) {
  camera.position.set(target.x, target.y - 10000, target.z + 10000);
  camera.lookAt(target);
}

export function createCamera() {
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

  camera.updateProjectionMatrix();
  camera.updateMatrix();
  positionCamera(camera, initialTarget);

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
    zoomControl.onChange = (zoom) => {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      camera.updateMatrix();
      state.cameraZoomObservable.next(zoom);
      state.forceRender = true;
    };

    const dirLight = new DirectionalLight(0xffffff, 5);
    dirLight.position.set(0, -100, 595);
    dirLight.lookAt(0, 0, 0);
    state.scene.add(dirLight);

    const ambLight = new AmbientLight(0xffffff, 2);
    state.scene.add(ambLight);
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
