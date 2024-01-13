import { ComponentName, initComponentData } from "../ComponentData";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

export const enum Layer {
  BACKGROUND,
  OBJECT,
  USER_INTERFACE,
}

const NAME = ComponentName.Layer;
const DATA = initComponentData(
  NAME,
  [],
  hasLayer,
  getLayer,
  setLayer,
  removeLayer,
);

export function setLayer(entityId: number, value: Layer) {
  if (value !== DATA[entityId]) {
    setRenderStateDirty();
    DATA[entityId] = value;
  }
}

export function hasLayer(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getLayer(entityId: number): Layer {
  return DATA[entityId] || Layer.BACKGROUND;
}

export function removeLayer(entityId: number): void {
  invariant(hasLayer(entityId), `Entity ${entityId} does not have a Layer`);
  setRenderStateDirty();
  delete DATA[entityId];
}
