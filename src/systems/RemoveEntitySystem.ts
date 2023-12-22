import { removeEntity } from "../Entity";
import { executeFilterQuery } from "../Query";
import { getTileX, getTileY, removeObjectFromTile } from "../Tile";
import { isToBeRemoved } from "../components/ToBeRemoved";

const entityIds: number[] = [];
function listEntitiesToBeRemoved(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(isToBeRemoved, entityIds);
}

export function RemoveEntitySystem() {
  for (const id of listEntitiesToBeRemoved()) {
    removeEntity(id);
    removeObjectFromTile(id, getTileX(id), getTileY(id));
  }
}
