import {invariant} from "../Error";

const DATA: Array<boolean> = [];

export function setIsLoading(entityId: number, value: boolean) {
  DATA[entityId] = value;
}

export function hasIsLoading(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getIsLoading(entityId: number): boolean {
  invariant(hasIsLoading(entityId), `Entity ${entityId} does not have a IsLoading`);
  return DATA[entityId];
}
