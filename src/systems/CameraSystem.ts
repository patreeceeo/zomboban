import { EntityName, getNamedEntity } from "../Entity";
import {
  getCameraFollow,
  hasCameraFollow,
  setCameraFollow,
} from "../components/CameraFollow";
import { setPosition } from "../components/Position";
import { getPositionX, setPositionX } from "../components/PositionX";
import { getPositionY, setPositionY } from "../components/PositionY";
import { SCREENX_PX, SCREENY_PX, TILEX_PX, TILEY_PX } from "../units/convert";
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
    const cameraX = getPositionX(cameraId);
    const cameraY = getPositionY(cameraId);
    if (x - cameraX > (SCREENX_PX - TILEX_PX) / 2) {
      setPositionX(cameraId, (cameraX + SCREENX_PX) as Px);
      setRenderStateDirty();
    }
    if (y - cameraY > (SCREENY_PX - TILEY_PX) / 2) {
      setPositionY(cameraId, (cameraY + SCREENY_PX) as Px);
      setRenderStateDirty();
    }
    if (x - cameraX < -SCREENX_PX / 2) {
      setPositionX(cameraId, (cameraX - SCREENX_PX) as Px);
      setRenderStateDirty();
    }
    if (y - cameraY < -SCREENY_PX / 2) {
      setPositionY(cameraId, (cameraY - SCREENY_PX) as Px);
      setRenderStateDirty();
    }
  }
}
