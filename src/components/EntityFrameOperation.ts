import { ComponentName, initComponentData } from "../ComponentData";
import { setRenderStateDirty } from "../systems/RenderSystem";

const NAME = ComponentName.EntityFrameOperation;
const DATA = initComponentData(NAME) as EntityFrameOperation[];

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

export function isToBeRemoved(entityId: number): boolean {
  return DATA[entityId] === EntityFrameOperation.REMOVE;
}

export function isToBeRestored(entityId: number): boolean {
  return DATA[entityId] === EntityFrameOperation.RESTORE;
}
