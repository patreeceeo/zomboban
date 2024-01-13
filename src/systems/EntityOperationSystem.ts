import { listRemovedEntities, registerEntity, removeEntity } from "../Entity";
import { executeFilterQuery } from "../Query";
import {
  getTileX,
  getTileY,
  placeObjectInTile,
  removeObjectFromTile,
} from "../Tile";
import {
  EntityFrameOperation,
  isToBeRemoved,
  isToBeRestored,
  setEntityFrameOperation,
} from "../components/EntityFrameOperation";

const entityIds: number[] = [];
function listEntitiesToBeRemoved(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(isToBeRemoved, entityIds);
}

function listEntitiesToBeRestored(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(isToBeRestored, entityIds, listRemovedEntities());
}

export function EntityOperationSystem() {
  for (const entityId of listEntitiesToBeRestored()) {
    registerEntity(entityId);
    placeObjectInTile(entityId, getTileX(entityId), getTileY(entityId));
    setEntityFrameOperation(entityId, EntityFrameOperation.NONE);
  }

  for (const id of listEntitiesToBeRemoved()) {
    removeEntity(id);
    removeObjectFromTile(id, getTileX(id), getTileY(id));
    setEntityFrameOperation(id, EntityFrameOperation.NONE);
  }
}
