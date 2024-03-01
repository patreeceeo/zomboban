import { invariant } from "../Error";
import { executeFilterQuery } from "../Query";
import {
  getTileX,
  getTileY,
  placeObjectInTile,
  removeObjectFromTile
} from "../Tile";
import { EntityFrameOperationComponent } from "../components";
import { stateOld } from "../state";

// TODO is this system necessary? perhaps instead there should be addingEntities and removingEntities sets...

const entityIds: number[] = [];
function listEntitiesToBeRemoved(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    stateOld.isEntityRemovedThisFrame,
    entityIds,
    stateOld.addedEntities
  );
}

function listEntitiesToBeRestored(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    stateOld.isEntityRestoredThisFrame,
    entityIds,
    stateOld.removedEntities
  );
}

export function EntityOperationSystem() {
  for (const entityId of listEntitiesToBeRestored()) {
    stateOld.addEntity(undefined, entityId);
    placeObjectInTile(entityId, getTileX(entityId), getTileY(entityId));
    stateOld.remove(EntityFrameOperationComponent, entityId);
  }

  for (const id of listEntitiesToBeRemoved()) {
    stateOld.removeEntity(id);
    removeObjectFromTile(id, getTileX(id), getTileY(id));
    stateOld.remove(EntityFrameOperationComponent, id);
  }

  invariant(stateOld.isSane(), "state corrupted!");
}
