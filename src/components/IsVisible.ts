import { ComponentName, initComponentData } from "../ComponentData";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

const NAME = ComponentName.IsVisible;
const DATA = initComponentData(
  NAME,
  [],
  hasIsVisible,
  getIsVisible,
  setIsVisible,
  removeIsVisible,
);

export function setIsVisible(entityId: number, value: boolean) {
  if (value !== DATA[entityId]) {
    setRenderStateDirty();
    DATA[entityId] = value;
  }
}

export function hasIsVisible(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getIsVisible(entityId: number): boolean {
  invariant(
    hasIsVisible(entityId),
    `Entity ${entityId} does not have IsVisible`,
  );
  return DATA[entityId];
}

export function removeIsVisible(entityId: number) {
  delete DATA[entityId];
}
