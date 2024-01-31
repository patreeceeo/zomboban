import { defineComponent } from "../Component";
import { invariant } from "../Error";

const DATA = defineComponent("LevelId", [], has, get, set, remove);

function has(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

function get(entityId: number): number {
  invariant(
    has(entityId),
    `Entity ${entityId} does not have a LevelId component`
  );
  return DATA[entityId];
}

function set(entityId: number, value: number): void {
  DATA[entityId] = value;
}

function remove(entityId: number): void {
  delete DATA[entityId];
}

export const hasLevelId = has;
export const getLevelId = get;
export const setLevelId = set;
export const removeLevelId = remove;
