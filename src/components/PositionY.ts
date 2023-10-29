import {invariant} from "../Error";

const DATA: Array<number> = [];

export function setPositionY(entityId: number, value: number) {
  DATA[entityId] = value;
}

export function hasPositionY(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getPositionY(entityId: number): number {
  invariant(hasPositionY(entityId), `Entity ${entityId} does not have a PositionY`);
  return DATA[entityId];
}
