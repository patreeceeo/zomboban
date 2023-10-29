import {invariant} from "../Error";
import {setDirty} from "../systems/RenderSystem";

const DATA: Array<number> = [];

export function setPositionY(entityId: number, value: number) {
  DATA[entityId] = value;
  setDirty();
}

export function hasPositionY(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getPositionY(entityId: number): number {
  invariant(hasPositionY(entityId), `Entity ${entityId} does not have a PositionY`);
  return DATA[entityId];
}
