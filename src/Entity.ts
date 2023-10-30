import {invariant} from "./Error";
import {registerEntity} from "./Query";

let _nextId = 0;

export function addEntity(): number {
  const id = _nextId;
  _nextId++;
  registerEntity(id)
  return id;
}

export enum EntityName {
  DEFAULT_PIXI_APP = "DEFAULT_PIXI_APP",
  FLOOR_IMAGE = "FLOOR_IMAGE",
  EDITOR_CURSOR_IMAGE = "EDITOR_CURSOR_IMAGE",
}

const NAMED_ENTITY_DATA: Partial<Record<EntityName, number>> = {}

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
