import {invariant} from "../Error";

const DATA: Array<number> = [];

export function setRenderLayer(entityId: number, value: number) {
  DATA[entityId] = value;
}

export function hasRenderLayer(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getRenderLayer(entityId: number): number {
  invariant(hasRenderLayer(entityId), `Entity ${entityId} does not have a RenderLayer`);
  return DATA[entityId];
}

export function isRenderLayer(entityId: number, value: number): boolean {
  return DATA[entityId] === value;
}

