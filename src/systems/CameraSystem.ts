import { System } from "../System";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { State } from "../state";
import { OrthographicCamera } from "three";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";

export class CameraSystem extends System<State> {
  start(state: State) {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    const target = state.cameraTarget;
    camera.zoom = Math.min(1 / SCREENX_PX, 1 / SCREENY_PX);
    camera.updateProjectionMatrix();
    camera.position.set(target.x, target.y - 250, target.z + 750);
    camera.lookAt(target);
    state.camera = camera;

    const controls = new OrbitControls(state.camera, state.renderer.domElement);
    controls.enableRotate = false;
  }
}
