import { loadPartialComponent, savePartialComponent } from "../Component";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

const STORAGE_KEY = "Component:PositionX";
const DATA: Array<Px> = [];

export function setPositionX(entityId: number, value: Px) {
  if (value !== DATA[entityId]) {
    setRenderStateDirty();
    DATA[entityId] = value;
  }
}

export function hasPositionX(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getPositionX(entityId: number): Px {
  invariant(
    hasPositionX(entityId),
    `Entity ${entityId} does not have a PositionX`,
  );
  return DATA[entityId];
}

export function removePositionX(entityId: number): void {
  invariant(
    hasPositionX(entityId),
    `Entity ${entityId} does not have a PositionX`,
  );
  setRenderStateDirty();
  delete DATA[entityId];
}

export function savePositionX(selectedEntities: ReadonlyArray<number>) {
  savePartialComponent(STORAGE_KEY, DATA, selectedEntities);
}

export function loadPositionX(nextEntityId: number) {
  loadPartialComponent(STORAGE_KEY, DATA, nextEntityId);
}
