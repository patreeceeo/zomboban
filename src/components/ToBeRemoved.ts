import { setRenderStateDirty } from "../systems/RenderSystem";

const DATA: Array<boolean> = [];

export function setToBeRemoved(entityId: number, value: boolean) {
  DATA[entityId] = value;
  setRenderStateDirty();
}

export function isToBeRemoved(entityId: number): boolean {
  return !!DATA[entityId];
}
