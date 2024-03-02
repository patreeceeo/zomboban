import { System } from "../System";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { State } from "../state";
import { OrthographicCamera } from "three";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";

export function createCamera() {
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  camera.zoom = Math.min(1 / SCREENX_PX, 1 / SCREENY_PX);
  camera.updateProjectionMatrix();
  return camera;
}

export class CameraSystem extends System<State> {
  start(state: State) {
    const camera = state.camera;
    const target = state.cameraTarget;
    camera.position.set(target.x, target.y - 250, target.z + 750);
    camera.lookAt(target);

    const controls = new OrbitControls(state.camera, state.renderer.domElement);
    controls.enableRotate = false;
  }
}
