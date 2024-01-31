import { listRemovedEntities, registerEntity, removeEntity } from "../Entity";
import { invariant } from "../Error";
import { executeFilterQuery } from "../Query";
import {
  getTileX,
  getTileY,
  placeObjectInTile,
  removeObjectFromTile,
} from "../Tile";
import {
  EntityFrameOperation,
  getEntityFrameOperation,
  isToBeRemoved,
  isToBeRestored,
  removeEntityFrameOperation,
} from "../components/EntityFrameOperation";
import { hasPosition } from "../components/Position";

const entityIds: number[] = [];
function listEntitiesToBeRemoved(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(isToBeRemoved, entityIds);
}

function listEntitiesToBeRestored(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(isToBeRestored, entityIds, listRemovedEntities());
}

const OPERATION_STEPS_MAP: Record<
  EntityFrameOperation,
  ((entityId: number) => void)[]
> = {
  [EntityFrameOperation.RESTORE]: [
    (id) => {
      registerEntity(id);
      if (hasPosition(id)) {
        placeObjectInTile(id, getTileX(id), getTileY(id));
      }
    },
  ],
  [EntityFrameOperation.REMOVE]: [
    (id) => {
      if (hasPosition(id)) {
        removeObjectFromTile(id, getTileX(id), getTileY(id));
      }
      removeEntity(id);
    },
  ],
};

export function addEntityOperationStep(
  operation: EntityFrameOperation,
  step: (entityId: number) => void
): void {
  const steps = OPERATION_STEPS_MAP[operation];
  invariant(
    !steps.includes(step),
    `step already exists for operation ${operation}`
  );
  steps.push(step);
}

export function executeEntityOperation(
  entityId: number,
  operation = getEntityFrameOperation(entityId)
): void {
  const steps = OPERATION_STEPS_MAP[operation];
  for (const step of steps) {
    step(entityId);
  }
  removeEntityFrameOperation(entityId);
}

const restoreSteps = OPERATION_STEPS_MAP[EntityFrameOperation.RESTORE];
const removeSteps = OPERATION_STEPS_MAP[EntityFrameOperation.REMOVE];

export function EntityOperationSystem() {
  for (const id of listEntitiesToBeRestored()) {
    for (const step of restoreSteps) {
      step(id);
    }
    removeEntityFrameOperation(id);
  }

  for (const id of listEntitiesToBeRemoved()) {
    for (const step of removeSteps) {
      step(id);
    }
    removeEntityFrameOperation(id);
  }
}
