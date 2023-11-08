import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

const DATA: Array<number> = [];

export function setPositionX(entityId: number, value: number) {
  if (value !== DATA[entityId]) {
    setRenderStateDirty();
    DATA[entityId] = value;
  }
}

export function hasPositionX(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getPositionX(entityId: number): number {
  invariant(
    hasPositionX(entityId),
    `Entity ${entityId} does not have a PositionX`,
  );
  return DATA[entityId];
}
