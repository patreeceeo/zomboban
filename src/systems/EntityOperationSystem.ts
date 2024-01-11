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

function listBehaviorEntitiesBeingRemoved() {
  entityIds.length = 0;
  return executeFilterQuery(and(hasActLike, isToBeRemoved), entityIds);
}

function listBehaviorEntitiesToBeRestored(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    and(hasActLike, isToBeRestored),
    entityIds,
    listRemovedEntities(),
  );
}

export function EntityOperationSystem() {
  for (const entityId of listEntitiesToBeRestored()) {
    registerEntity(entityId);
    placeObjectInTile(entityId, getTileX(entityId), getTileY(entityId));
  }

  for (const entityId of listBehaviorEntitiesToBeRestored()) {
    const behavior = getActLike(entityId);
    behavior.start();
  }

  for (const entityId of listEntitiesToBeRestored()) {
    setEntityFrameOperation(entityId, EntityFrameOperation.NONE);
  }

  for (const entityId of listBehaviorEntitiesBeingRemoved()) {
    const behavior = getActLike(entityId);
    behavior.stop();
  }

  for (const id of listEntitiesToBeRemoved()) {
    removeEntity(id);
    removeObjectFromTile(id, getTileX(id), getTileY(id));
    setEntityFrameOperation(id, EntityFrameOperation.NONE);
  }
}
