import { invariant } from "../Error";
import { executeFilterQuery } from "../Query";
import {
  getTileX,
  getTileY,
  placeObjectInTile,
  removeObjectFromTile,
} from "../Tile";
import { state } from "../state";

// TODO is this system necessary? perhaps instead there should be addingEntities and removingEntities sets...

const entityIds: number[] = [];
function listEntitiesToBeRemoved(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    state.isEntityRemovedThisFrame,
    entityIds,
    state.addedEntities,
  );
}

function listEntitiesToBeRestored(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    state.isEntityRestoredThisFrame,
    entityIds,
    state.removedEntities,
  );
}

export function EntityOperationSystem() {
  for (const entityId of listEntitiesToBeRestored()) {
    state.addEntity(undefined, entityId);
    placeObjectInTile(entityId, getTileX(entityId), getTileY(entityId));
    state.clearEntityFrameOperation(entityId);
  }

  for (const id of listEntitiesToBeRemoved()) {
    state.removeEntity(id);
    removeObjectFromTile(id, getTileX(id), getTileY(id));
    state.clearEntityFrameOperation(id);
  }

  invariant(state.isSane(), "state corrupted!");
}
