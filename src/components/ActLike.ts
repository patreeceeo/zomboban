import { loadPartialComponent, savePartialComponent } from "../Component";

export enum ActLike {
  PLAYER = 1,
  PUSHABLE = 2,
  BARRIER = 4,
  ZOMBIE = 8,
  ANY_GAME_OBJECT = ActLike.PLAYER |
    ActLike.PUSHABLE |
    ActLike.BARRIER |
    ActLike.ZOMBIE,
  EDITOR_CURSOR = 16,
}

const STORAGE_KEY = "Component:ActLike";
const DATA: Array<ActLike> = [];

export function setActLike(entityId: number, value: ActLike) {
  DATA[entityId] = value;
}

export function removeActLike(entityId: number) {
  delete DATA[entityId];
}

export function isActLike(entityId: number, value: ActLike | number): boolean {
  return (DATA[entityId] & value) !== 0;
}

export function getActLike(entityId: number): ActLike {
  return DATA[entityId];
}

export function saveActLike(selectedEntities: ReadonlyArray<number>) {
  savePartialComponent(STORAGE_KEY, DATA, selectedEntities);
}

export function loadActLike(nextEntityId: number) {
  loadPartialComponent(STORAGE_KEY, DATA, nextEntityId);
}

export function stringifyActLike(value: ActLike | undefined): string {
  if (value === undefined) return "(none)";
  if (value === ActLike.BARRIER) return "BARRIER";
  if (value === ActLike.PUSHABLE) return "PUSHABLE";
  if (value === ActLike.PLAYER) return "PLAYER";
  if (value === ActLike.ZOMBIE) return "ZOMBIE";
  return "?";
}
