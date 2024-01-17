import { defineComponent } from "../Component";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

const DATA = defineComponent(
  "PositionX",
  [],
  hasPositionX,
  getPositionX,
  setPositionX,
  removePositionX,
) as Px[];

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

export function getPositionXOrDefault(entityId: number, defaultValue: Px): Px {
  return hasPositionX(entityId) ? getPositionX(entityId) : defaultValue;
}

export function removePositionX(entityId: number): void {
  invariant(
    hasPositionX(entityId),
    `Entity ${entityId} does not have a PositionX`,
  );
  setRenderStateDirty();
  delete DATA[entityId];
}
