import { loadPartialComponent, savePartialComponent } from "../Component";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

export const enum Layer {
  BACKGROUND,
  OBJECT,
  USER_INTERFACE,
}

const STORAGE_KEY = "Component:Layer";
const DATA: Array<Layer> = [];

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

export function saveLayer(selectedEntities: ReadonlyArray<number>) {
  savePartialComponent(STORAGE_KEY, DATA, selectedEntities);
}

export function loadLayer(nextEntityId: number) {
  loadPartialComponent(STORAGE_KEY, DATA, nextEntityId);
}
