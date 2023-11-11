import { loadPartialComponent, savePartialComponent } from "../Component";
const STORAGE_KEY = "Component:ShouldSave";
const DATA: Array<boolean> = [];

export function setShouldSave(entityId: number, value: boolean) {
  DATA[entityId] = value;
}

export function shouldSave(entityId: number): boolean {
  return !!DATA[entityId];
}

export function saveShouldSave(selectedEntities: ReadonlyArray<number>) {
  savePartialComponent(STORAGE_KEY, DATA, selectedEntities);
}

export function loadShouldSave(nextEntityId: number) {
  loadPartialComponent(STORAGE_KEY, DATA, nextEntityId);
}
