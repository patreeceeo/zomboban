import { Vector3 } from "../Vector3";
import { PositionComponent } from "../components";
import { state } from "../state";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let _followId: number | undefined = undefined;
let _controls: OrbitControls;

export function initCameraSystem() {
  state.camera.position.set(0, -250, 750);
  state.camera.lookAt(Vector3.ZERO);
  _controls = new OrbitControls(state.camera, state.renderer.domElement);
  _controls.enableRotate = false;
  // _controls.addEventListener("change", () => {
  // });
}

export function followEntityWithCamera(entityId: number) {
  _followId = entityId;
}

export function CameraSystem() {
  if (_followId !== undefined) {
    const camera = state.camera;
    const position = state.get(PositionComponent, _followId);
    camera.position.set(position.x, position.y - 250, 750);
    camera.lookAt(position);
  }
  // _controls.update();
}
