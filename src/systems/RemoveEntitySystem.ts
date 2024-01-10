import { removeEntity } from "../Entity";
import { and, executeFilterQuery } from "../Query";
import { getTileX, getTileY, removeObjectFromTile } from "../Tile";
import { getActLike, hasActLike } from "../components/ActLike";
import { isToBeRemoved } from "../components/ToBeRemoved";

const entityIds: number[] = [];
function listEntitiesToBeRemoved(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(isToBeRemoved, entityIds);
}

function listBehaviorEntitiesBeingRemoved() {
  entityIds.length = 0;
  return executeFilterQuery(and(hasActLike, isToBeRemoved), entityIds);
}

export function RemoveEntitySystem() {
  for (const entityId of listBehaviorEntitiesBeingRemoved()) {
    const behavior = getActLike(entityId);
    behavior.destroy();
  }

  for (const id of listEntitiesToBeRemoved()) {
    removeEntity(id);
    removeObjectFromTile(id, getTileX(id), getTileY(id));
  }
}
