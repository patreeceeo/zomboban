import { ComponentName, initComponentData } from "../ComponentData";

export enum ActLike {
  PLAYER = 1,
  PUSHABLE = 2,
  BARRIER = 4,
  ZOMBIE = 8,
  PORTAL = 16,
  ANY_GAME_OBJECT = ActLike.PLAYER |
    ActLike.PUSHABLE |
    ActLike.BARRIER |
    ActLike.ZOMBIE |
    ActLike.PORTAL,
  EDITOR_CURSOR = 1024,
}

const NAME = ComponentName.ActLike;
const DATA = initComponentData(NAME) as ActLike[];

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

export function stringifyActLike(value: ActLike | undefined): string {
  if (value === undefined) return "(none)";
  if (value === ActLike.BARRIER) return "BARRIER";
  if (value === ActLike.PUSHABLE) return "PUSHABLE";
  if (value === ActLike.PLAYER) return "PLAYER";
  if (value === ActLike.ZOMBIE) return "ZOMBIE";
  return "?";
}
