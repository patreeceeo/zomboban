import { reuseVec2 } from "../Vec2";
import { CameraFollowComponent, PositionComponent } from "../components";
import { ReservedEntity } from "../entities";
import { state } from "../state";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { setRenderStateDirty } from "./RenderSystem";

export function initCameraSystem() {
  const cameraId = ReservedEntity.CAMERA;
  state.set(
    PositionComponent,
    cameraId,
    reuseVec2((SCREENX_PX / 2) as Px, (SCREENY_PX / 2) as Px),
  );
}

export function followEntityWithCamera(entityId: number) {
  const cameraId = ReservedEntity.CAMERA;
  state.set(CameraFollowComponent, cameraId, entityId);
}

export function CameraSystem() {
  const cameraId = ReservedEntity.CAMERA;
  if (state.has(CameraFollowComponent, cameraId)) {
    const followId = state.get(CameraFollowComponent, cameraId);
    state.set(
      PositionComponent,
      cameraId,
      state.get(PositionComponent, followId),
    );
    setRenderStateDirty();
  }
}
