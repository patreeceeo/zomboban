import { ComponentName, initComponentData } from "../ComponentData";

export enum ActLike {
  NONE = 0,
  PLAYER = 1,
  BOX = 1 << 1,
  WALL = 1 << 2,
  BRO = 1 << 3,
  AIRPLANE = 1 << 4,
  GAME_OBJECT = ActLike.PLAYER |
    ActLike.BOX |
    ActLike.WALL |
    ActLike.BRO |
    ActLike.AIRPLANE,
  EDITOR_CURSOR = 1 << 40,
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
  if (value === ActLike.WALL) return "WALL";
  if (value === ActLike.BOX) return "BOX";
  if (value === ActLike.PLAYER) return "PLAYER";
  if (value === ActLike.BRO) return "BRO";
  if (value === ActLike.AIRPLANE) return "AIRPLANE";
  return `? (${value})`;
}
