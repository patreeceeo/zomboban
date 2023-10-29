import {invariant} from "../Error";
import {setDirty} from "../systems/RenderSystem";


const DATA: Array<number> = [];

export function setPositionX(entityId: number, value: number) {
  DATA[entityId] = value;
  setDirty();
}

export function hasPositionX(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getPositionX(entityId: number): number {
  invariant(hasPositionX(entityId), `Entity ${entityId} does not have a PositionX`);
  return DATA[entityId];
}
