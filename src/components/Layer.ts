import {invariant} from "../Error";

export const enum Layer {
  BACKGROUND,
  OBJECT,
  USER_INTERFACE,
}

const DATA: Array<Layer> = [];

export function setLayer(entityId: number, value: Layer) {
  DATA[entityId] = value;
}

export function hasLayer(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getLayer(entityId: number): Layer {
  invariant(hasLayer(entityId), `Entity ${entityId} does not have a Layer`);
  return DATA[entityId];
}
