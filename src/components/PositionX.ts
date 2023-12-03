import { ComponentName, initComponentData } from "../ComponentData";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

const NAME = ComponentName.PositionX;
const DATA = initComponentData(NAME) as Px[];

export function setPositionX(entityId: number, value: Px) {
  if (value !== DATA[entityId]) {
    setRenderStateDirty();
    DATA[entityId] = value;
  }
}

export function hasPositionX(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getPositionX(entityId: number): Px {
  invariant(
    hasPositionX(entityId),
    `Entity ${entityId} does not have a PositionX`,
  );
  return DATA[entityId];
}

export function removePositionX(entityId: number): void {
  invariant(
    hasPositionX(entityId),
    `Entity ${entityId} does not have a PositionX`,
  );
  setRenderStateDirty();
  delete DATA[entityId];
}
