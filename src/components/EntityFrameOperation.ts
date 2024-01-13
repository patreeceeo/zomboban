import { ComponentName, initComponentData } from "../ComponentData";
import { invariant } from "../Error";

const NAME = ComponentName.EntityFrameOperation;
const DATA = initComponentData(
  NAME,
  [],
  hasEntityFrameOperations,
  getEntityFrameOperations,
  setEntityFrameOperations,
  clearAllEntityFrameOperations,
) as EntityFrameOperation[];

export const enum EntityFrameOperation {
  NONE = 0,
  REMOVE_ONLY = 1,
  RESTORE_ONLY = 1 << 0,
  START_BEHAVIOR = 1 << 2,
  STOP_BEHAVIOR = 1 << 3,
  REMOVE = EntityFrameOperation.REMOVE_ONLY |
    EntityFrameOperation.STOP_BEHAVIOR,
  RESTORE = EntityFrameOperation.RESTORE_ONLY |
    EntityFrameOperation.START_BEHAVIOR,
}

export function setEntityFrameOperations(
  entityId: number,
  value: EntityFrameOperation,
) {
  DATA[entityId] = value;
}

export function addEntityFrameOperation(
  entityId: number,
  value: EntityFrameOperation,
) {
  DATA[entityId] = (DATA[entityId] ?? EntityFrameOperation.NONE) | value;
}

export function removeEntityFrameOperation(
  entityId: number,
  value: EntityFrameOperation,
) {
  DATA[entityId] = (DATA[entityId] ?? EntityFrameOperation.NONE) & ~value;
}

export function hasEntityFrameOperations(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getEntityFrameOperations(
  entityId: number,
): EntityFrameOperation {
  const value = DATA[entityId];
  invariant(
    value !== undefined,
    `Entity ${entityId} does not have a EntityFrameOperation`,
  );
  return value;
}

function _has(entityId: number, operation: EntityFrameOperation): boolean {
  return (DATA[entityId] & operation) !== EntityFrameOperation.NONE;
}

export function isToBeRemoved(entityId: number): boolean {
  return _has(entityId, EntityFrameOperation.REMOVE_ONLY);
}

export function isToBeRestored(entityId: number): boolean {
  return _has(entityId, EntityFrameOperation.RESTORE);
}

export function isToBeStarted(entityId: number): boolean {
  return (
    _has(entityId, EntityFrameOperation.START_BEHAVIOR) ||
    !hasEntityFrameOperations(entityId)
  );
}

export function isToBeStopped(entityId: number): boolean {
  return _has(entityId, EntityFrameOperation.STOP_BEHAVIOR);
}

export function clearAllEntityFrameOperations(entityId: number) {
  delete DATA[entityId];
}
