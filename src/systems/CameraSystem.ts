import { EntityName, getNamedEntity } from "../Entity";
import {
  getCameraFollow,
  hasCameraFollow,
  setCameraFollow,
} from "../components/CameraFollow";
import { setPosition } from "../components/Position";
import { getPositionX, setPositionX } from "../components/PositionX";
import { getPositionY, setPositionY } from "../components/PositionY";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { setRenderStateDirty } from "./RenderSystem";

export function initCameraSystem() {
  const cameraId = getNamedEntity(EntityName.CAMERA);
  setPosition(cameraId, (SCREENX_PX / 2) as Px, (SCREENY_PX / 2) as Px);
}

export function followEntityWithCamera(entityId: number) {
  const cameraId = getNamedEntity(EntityName.CAMERA);
  setCameraFollow(cameraId, entityId);
}

export function CameraSystem() {
  const cameraId = getNamedEntity(EntityName.CAMERA);
  if (hasCameraFollow(cameraId)) {
    const followId = getCameraFollow(cameraId);
    const x = getPositionX(followId);
    const y = getPositionY(followId);
    setPositionX(cameraId, x);
    setPositionY(cameraId, y);
    setRenderStateDirty();
  }
}
