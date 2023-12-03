import { ComponentName, initComponentData } from "../ComponentData";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

const NAME = ComponentName.PositionY;
const DATA = initComponentData(NAME) as Px[];

export function setPositionY(entityId: number, value: Px) {
  if (value !== DATA[entityId]) {
    setRenderStateDirty();
    DATA[entityId] = value;
  }
}

export function hasPositionY(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getPositionY(entityId: number): Px {
  invariant(
    hasPositionY(entityId),
    `Entity ${entityId} does not have a PositionY`,
  );
  return DATA[entityId];
}

export function removePositionY(entityId: number): void {
  invariant(
    hasPositionY(entityId),
    `Entity ${entityId} does not have a PositionY`,
  );
  setRenderStateDirty();
  delete DATA[entityId];
}
