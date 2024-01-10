import { ComponentName, initComponentData } from "../ComponentData";
import { invariant } from "../Error";

export interface Behavior {
  readonly type: ActLike;
  readonly entityId: number;
  initializeWithComponents(): void;
  toString(): string;
  onFrame(deltaTime: number, elapsedTime: number): void;
  destroy(): void;
}

// TODO: do away with this enum?
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
  PUSHER = ActLike.PLAYER | ActLike.BRO,
  ENEMY = ActLike.BRO,
  CURSOR = 1 << 40,
}

const NAME = ComponentName.ActLike;
const DATA = initComponentData(NAME) as Behavior[];

export function setActLike(entityId: number, value: Behavior) {
  invariant("onFrame" in value, "This doesn't look like a behavior");
  DATA[entityId] = value;
}

export function removeActLike(entityId: number) {
  delete DATA[entityId];
}

export function isActLike(entityId: number, value: ActLike | number): boolean {
  return (DATA[entityId]?.type & value) !== 0;
}

export function hasActLike(entityId: number): boolean {
  return !!DATA[entityId];
}

export function getActLike(entityId: number): Behavior {
  return DATA[entityId];
}
