import { ComponentName, initComponentData } from "../ComponentData";
import { setRenderStateDirty } from "../systems/RenderSystem";

const NAME = ComponentName.ToBeRemoved;
const DATA = initComponentData(NAME) as boolean[];

export function setToBeRemoved(entityId: number, value: boolean) {
  DATA[entityId] = value;
  setRenderStateDirty();
}

export function isToBeRemoved(entityId: number): boolean {
  return !!DATA[entityId];
}
