import { ComponentName, initComponentData } from "../ComponentData";
import { invariant } from "../Error";

const NAME = ComponentName.CameraFollow;
const DATA = initComponentData(NAME) as number[];

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
