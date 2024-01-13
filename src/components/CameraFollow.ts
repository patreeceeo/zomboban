import { defineComponent } from "../Component";
import { invariant } from "../Error";

const DATA = defineComponent(
  "CameraFollow",
  [],
  hasCameraFollow,
  getCameraFollow,
  setCameraFollow,
  removeCameraFollow,
);

export function setCameraFollow(entityId: number, value: number) {
  if (DATA[entityId] !== value) {
    DATA[entityId] = value;
  }
}

export function hasCameraFollow(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getCameraFollow(entityId: number): number {
  invariant(
    hasCameraFollow(entityId),
    `Entity ${entityId} does not have a CameraFollow`,
  );
  return DATA[entityId];
}

export function removeCameraFollow(entityId: number) {
  delete DATA[entityId];
}
