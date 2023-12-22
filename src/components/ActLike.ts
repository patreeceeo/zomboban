import { ComponentName, initComponentData } from "../ComponentData";

export enum ActLike {
  NONE = 0,
  PLAYER = 1,
  PUSHABLE = 2,
  BARRIER = 4,
  ZOMBIE = 8,
  POTION = 16,
  UNZOMBIE = 32,
  ANY_GAME_OBJECT = ActLike.PLAYER |
    ActLike.PUSHABLE |
    ActLike.BARRIER |
    ActLike.ZOMBIE |
    ActLike.POTION |
    ActLike.UNZOMBIE,
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
  if (value === undefined || value === ActLike.NONE) return "(none)";
  if (value === ActLike.BARRIER) return "BARRIER";
  if (value === ActLike.PUSHABLE) return "PUSHABLE";
  if (value === ActLike.PLAYER) return "PLAYER";
  if (value === ActLike.ZOMBIE) return "ZOMBIE";
  if (value === ActLike.POTION) return "POTION";
  if (value === ActLike.UNZOMBIE) return "UNZOMBIE";
  return `? (${value})`;
}
