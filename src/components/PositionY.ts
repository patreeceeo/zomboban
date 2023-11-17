import { loadPartialComponent, savePartialComponent } from "../Component";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

const STORAGE_KEY = "Component:PositionY";
const DATA: Array<Px> = [];

export function setPositionY(entityId: number, value: Px) {
  if (value !== DATA[entityId]) {
    setRenderStateDirty();
    DATA[entityId] = value;
  }
}

export function hasPositionY(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getPositionY(entityId: number): Px {
  invariant(
    hasPositionY(entityId),
    `Entity ${entityId} does not have a PositionY`,
  );
  return DATA[entityId];
}

export function removePositionY(entityId: number): void {
  invariant(
    hasPositionY(entityId),
    `Entity ${entityId} does not have a PositionY`,
  );
  setRenderStateDirty();
  delete DATA[entityId];
}

export function savePositionY(selectedEntities: ReadonlyArray<number>) {
  savePartialComponent(STORAGE_KEY, DATA, selectedEntities);
}

export function loadPositionY(nextEntityId: number) {
  loadPartialComponent(STORAGE_KEY, DATA, nextEntityId);
}
