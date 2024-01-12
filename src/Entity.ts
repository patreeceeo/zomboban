// Array is much faster than Set, per my testing.
const ADDED_ENTITIES: Array<number> = [];
const REMOVED_ENTITIES: Array<number> = [];
const RECYCLED_ENTITIES: Array<number> = [];

export function registerEntity(entityId: number): void {
  ADDED_ENTITIES[entityId] = entityId;
}

export function addEntity(): number {
  const id = getNextEntityId();
  registerEntity(id);
  return id;
}

export function removeEntity(entityId: number): void {
  delete ADDED_ENTITIES[entityId];
  REMOVED_ENTITIES.push(entityId);
}

export function recycleRemovedEntities(): void {
  RECYCLED_ENTITIES.push(...REMOVED_ENTITIES);
  REMOVED_ENTITIES.length = 0;
}

export function getNextEntityId(): number {
  return RECYCLED_ENTITIES.pop() || ADDED_ENTITIES.length;
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
}
