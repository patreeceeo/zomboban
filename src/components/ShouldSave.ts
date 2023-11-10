import { loadPartialComponent, savePartialComponent } from "../Component";
import { invariant } from "../Error";
const STORAGE_KEY = "Component:ShouldSave";
const DATA: Array<boolean> = [];

export function setShouldSave(entityId: number, value: boolean) {
  DATA[entityId] = value;
}

export function hasShouldSave(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getShouldSave(entityId: number): boolean {
  invariant(
    hasShouldSave(entityId),
    `Entity ${entityId} does not have a ShouldSave`,
  );
  return DATA[entityId];
}

export function saveShouldSave(selectedEntities: ReadonlyArray<number>) {
  savePartialComponent(STORAGE_KEY, DATA, selectedEntities);
}

export function loadShouldSave(nextEntityId: number) {
  loadPartialComponent(STORAGE_KEY, DATA, nextEntityId);
}
