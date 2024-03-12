import { System } from "../System";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Camera, OrthographicCamera, Vector3 } from "three";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { CameraState, RendererState } from "../state";

const initialTarget = new Vector3();

function positionCamera(camera: Camera, target: Vector3) {
  camera.position.set(target.x, target.y - 250, target.z + 750);
  camera.lookAt(target);
}

export function createCamera() {
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  camera.zoom = Math.min(1 / SCREENX_PX, 1 / SCREENY_PX);
  camera.updateProjectionMatrix();
  positionCamera(camera, initialTarget);
  return camera;
}

type State = CameraState & RendererState;

export class CameraSystem extends System<State> {
  start(state: State) {
    const controls = new OrbitControls(state.camera, state.renderer.domElement);
    controls.enableRotate = false;
  }
  update(state: State): void {
    const camera = state.camera;
    const target = state.cameraController?.position;
    if (target) {
      positionCamera(camera, target);
    }
  }
}
