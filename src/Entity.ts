import { invariant } from "./Error";

let _nextId = 0;
const ALL_ENTITIES: Array<number> = [];

export function registerEntity(entityId: number): void {
  ALL_ENTITIES[entityId] = entityId;
}

export function addEntity(): number {
  const id = _nextId;
  _nextId++;
  registerEntity(id);
  return id;
}

export function removeEntity(entityId: number): void {
  delete ALL_ENTITIES[entityId];
}

export function peekNextEntityId(): number {
  return _nextId;
}

export function setNextEntityId(id: number): void {
  _nextId = id;
}

export function listEntities(): ReadonlyArray<number> {
  return ALL_ENTITIES;
}

export function resetEntities(): void {
  ALL_ENTITIES.length = 0;
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
  TOUCHING_ZOMBIE_TEXT = "TOUCHING_ZOMBIE_TEXT",
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
