import { loadPartialComponent, savePartialComponent } from "../Component";

export enum ActLike {
  PLAYER,
  PUSHABLE,
  BARRIER,
  ZOMBIE,
  EDITOR_CURSOR,
}

const STORAGE_KEY = "Component:ActLike";
const DATA: Array<ActLike> = [];

export function setActLike(entityId: number, value: ActLike) {
  DATA[entityId] = value;
}

export function isActLike(entityId: number, value: ActLike): boolean {
  return DATA[entityId] === value;
}

export function saveActLike(selectedEntities: ReadonlyArray<number>) {
  savePartialComponent(STORAGE_KEY, DATA, selectedEntities);
}

export function loadActLike(nextEntityId: number) {
  loadPartialComponent(STORAGE_KEY, DATA, nextEntityId);
}
