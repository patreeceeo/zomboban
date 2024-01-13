import { ComponentName, initComponentData } from "../Component";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

const NAME = ComponentName.EntityFrameOperation;
const DATA = initComponentData(
  NAME,
  [],
  hasEntityFrameOperation,
  getEntityFrameOperation,
  setEntityFrameOperation,
  removeEntityFrameOperation,
) as EntityFrameOperation[];

export const enum EntityFrameOperation {
  NONE,
  REMOVE,
  RESTORE,
}

export function setEntityFrameOperation(
  entityId: number,
  value: EntityFrameOperation,
) {
  DATA[entityId] = value;
  setRenderStateDirty();
}

export function hasEntityFrameOperation(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getEntityFrameOperation(
  entityId: number,
): EntityFrameOperation {
  const value = DATA[entityId];
  invariant(
    value !== undefined,
    `Entity ${entityId} does not have a EntityFrameOperation`,
  );
  return value;
}

export function isToBeRemoved(entityId: number): boolean {
  return DATA[entityId] === EntityFrameOperation.REMOVE;
}

export function isToBeRestored(entityId: number): boolean {
  return DATA[entityId] === EntityFrameOperation.RESTORE;
}

export function removeEntityFrameOperation(entityId: number) {
  delete DATA[entityId];
}
