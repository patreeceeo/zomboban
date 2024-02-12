import { ReservedEntity } from "../entities";
import { state } from "../state";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { setRenderStateDirty } from "./RenderSystem";

export function initCameraSystem() {
  const cameraId = ReservedEntity.CAMERA;
  state.setPosition(cameraId, (SCREENX_PX / 2) as Px, (SCREENY_PX / 2) as Px);
}

export function followEntityWithCamera(entityId: number) {
  const cameraId = ReservedEntity.CAMERA;
  state.setCameraFollow(cameraId, entityId);
}

export function CameraSystem() {
  const cameraId = ReservedEntity.CAMERA;
  if (state.hasCameraFollow(cameraId)) {
    const followId = state.getCameraFollow(cameraId);
    const x = state.getPositionX(followId);
    const y = state.getPositionY(followId);
    state.setPosition(cameraId, x, y);
    setRenderStateDirty();
  }
}
