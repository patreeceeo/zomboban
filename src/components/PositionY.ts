import {invariant} from "../Error";
import {setRenderStateDirty} from "../systems/RenderSystem";

const DATA: Array<number> = [];

export function setPositionY(entityId: number, value: number) {
  if(value !== DATA[entityId]) {
    setRenderStateDirty();
    DATA[entityId] = value;
  }
}

export function hasPositionY(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getPositionY(entityId: number): number {
  invariant(hasPositionY(entityId), `Entity ${entityId} does not have a PositionY`);
  return DATA[entityId];
}
