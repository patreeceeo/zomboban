let _nextId = 0;

// Array is much faster than Set, per my testing.
const ADDED_ENTITIES: Array<number> = [];
const REMOVED_ENTITIES: Array<number> = [];

export function registerEntity(entityId: number): void {
  ADDED_ENTITIES[entityId] = entityId;
}

export function addEntity(): number {
  const id = _nextId;
  _nextId++;
  registerEntity(id);
  return id;
}

export function removeEntity(entityId: number): void {
  delete ADDED_ENTITIES[entityId];
  REMOVED_ENTITIES[entityId] = entityId;
}

export function peekNextEntityId(): number {
  return _nextId;
}

export function setNextEntityId(id: number): void {
  _nextId = id;
}

export function listEntities(): ReadonlyArray<number> {
  return ADDED_ENTITIES;
}

export function listRemovedEntities(): ReadonlyArray<number> {
  return REMOVED_ENTITIES;
}

export function resetEntities(): void {
  ADDED_ENTITIES.length = 0;
  REMOVED_ENTITIES.length = 0;
  _nextId = 0;
}
