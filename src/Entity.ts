import { invariant } from "./Error";

let _nextId = 0;

// Array is much faster than Set, per my testing.
const ACTIVE_ENTITIES: Array<number> = [];
const REMOVED_ENTITIES: Array<number> = [];

export function registerEntity(entityId: number): void {
  ACTIVE_ENTITIES[entityId] = entityId;
}

export function addEntity(): number {
  const id = _nextId;
  _nextId++;
  registerEntity(id);
  return id;
}

export function removeEntity(entityId: number): void {
  delete ACTIVE_ENTITIES[entityId];
  REMOVED_ENTITIES[entityId] = entityId;
}

export function peekNextEntityId(): number {
  return _nextId;
}

export function setNextEntityId(id: number): void {
  _nextId = id;
}

export function listEntities(): ReadonlyArray<number> {
  return ACTIVE_ENTITIES;
}

export function listRemovedEntities(): ReadonlyArray<number> {
  return REMOVED_ENTITIES;
}

export function resetEntities(): void {
  ACTIVE_ENTITIES.length = 0;
  REMOVED_ENTITIES.length = 0;
  _nextId = 0;
}

export enum EntityName {
  DEFAULT_PIXI_APP = "DEFAULT_PIXI_APP",
  CAMERA = "CAMERA",
  FLOOR_IMAGE = "FLOOR_IMAGE",
  WALL_IMAGE = "WALL_IMAGE",
  CRATE_IMAGE = "CRATE_IMAGE",
  PLAYER_DOWN_IMAGE = "PLAYER_DOWN_IMAGE",
  ZOMBIE_SWAY_ANIMATION = "ZOMBIE_SWAY_ANIMATION",
  POTION_SPIN_ANIMATION = "POTION_SPIN_ANIMATION",
  EDITOR_NORMAL_CURSOR_IMAGE = "EDITOR_NORMAL_CURSOR_IMAGE",
  EDITOR_REPLACE_CURSOR_IMAGE = "EDITOR_REPLACE_CURSOR_IMAGE",
  EDITOR_ORIENT_CURSOR_IMAGE = "EDITOR_ORIENT_CURSOR_IMAGE",
  GAME_OVER_TEXT = "GAME_OVER_TEXT",
  SCORE_TEXT = "SCORE_TEXT",
}

const NAMED_ENTITY_DATA: Partial<Record<EntityName, number>> = {};

export function addNamedEntities(): void {
  for (const name in EntityName) {
    setNamedEntity(name as EntityName, addEntity());
  }
}

export function setNamedEntity(name: EntityName, entityId: number) {
  NAMED_ENTITY_DATA[name] = entityId;
}

export function hasNamedEntity(name: EntityName): boolean {
  return NAMED_ENTITY_DATA[name] !== undefined;
}

export function getNamedEntity(name: EntityName): number {
  invariant(hasNamedEntity(name), `NamedEntity ${name} does not exist`);
  return NAMED_ENTITY_DATA[name]!;
}
