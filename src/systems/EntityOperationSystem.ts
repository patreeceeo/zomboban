import { listRemovedEntities, registerEntity, removeEntity } from "../Entity";
import { and, executeFilterQuery } from "../Query";
import {
  getTileX,
  getTileY,
  placeObjectInTile,
  removeObjectFromTile,
} from "../Tile";
import { getActLike, hasActLike } from "../components/ActLike";
import {
  EntityFrameOperation,
  isToBeRemoved,
  isToBeRestored,
  isToBeStopped,
  removeEntityFrameOperation,
} from "../components/EntityFrameOperation";

const entityIds: number[] = [];
function listEntitiesToBeStopped() {
  entityIds.length = 0;
  return executeFilterQuery(and(hasActLike, isToBeStopped), entityIds);
}

function listEntitiesToBeRemoved(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(isToBeRemoved, entityIds);
}

function listEntitiesToBeRestored(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(isToBeRestored, entityIds, listRemovedEntities());
}

export function EntityOperationSystem() {
  for (const entityId of listEntitiesToBeStopped()) {
    const behavior = getActLike(entityId);
    behavior.stop();
    removeEntityFrameOperation(entityId, EntityFrameOperation.STOP_BEHAVIOR);
  }

  for (const entityId of listEntitiesToBeRestored()) {
    registerEntity(entityId);
    placeObjectInTile(entityId, getTileX(entityId), getTileY(entityId));
    removeEntityFrameOperation(entityId, EntityFrameOperation.RESTORE_ONLY);
  }

  for (const id of listEntitiesToBeRemoved()) {
    removeEntity(id);
    removeObjectFromTile(id, getTileX(id), getTileY(id));
    removeEntityFrameOperation(id, EntityFrameOperation.REMOVE_ONLY);
  }
}
