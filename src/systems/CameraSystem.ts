import {
  getCameraFollow,
  hasCameraFollow,
  setCameraFollow,
} from "../components/CameraFollow";
import { setPosition } from "../components/Position";
import { getPositionX, setPositionX } from "../components/PositionX";
import { getPositionY, setPositionY } from "../components/PositionY";
import { ReservedEntity } from "../entities";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { setRenderStateDirty } from "./RenderSystem";

export function initCameraSystem() {
  const cameraId = ReservedEntity.CAMERA;
  setPosition(cameraId, (SCREENX_PX / 2) as Px, (SCREENY_PX / 2) as Px);
}

export function followEntityWithCamera(entityId: number) {
  const cameraId = ReservedEntity.CAMERA;
  setCameraFollow(cameraId, entityId);
}

export function CameraSystem() {
  const cameraId = ReservedEntity.CAMERA;
  if (hasCameraFollow(cameraId)) {
    const followId = getCameraFollow(cameraId);
    const x = getPositionX(followId);
    const y = getPositionY(followId);
    setPositionX(cameraId, x);
    setPositionY(cameraId, y);
    setRenderStateDirty();
  }
}
