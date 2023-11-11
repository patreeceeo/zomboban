import { removeEntity } from "../Entity";
import { executeFilterQuery } from "../Query";
import { isToBeRemoved } from "../components/ToBeRemoved";

const entityIds: number[] = [];
export function listEntitiesToBeRemoved(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(isToBeRemoved, entityIds);
}

export function RemoveEntitySystem() {
  for (const entityId of listEntitiesToBeRemoved()) {
    removeEntity(entityId);
  }
}
