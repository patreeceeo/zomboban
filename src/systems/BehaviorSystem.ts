import { and, executeFilterQuery } from "../Query";
import { getActLike, hasActLike } from "../components/ActLike";
import {
  EntityFrameOperation,
  isToBeStarted,
  removeEntityFrameOperation,
} from "../components/EntityFrameOperation";

const entityIds: number[] = [];
function listEntitiesToBeStarted(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(and(hasActLike, isToBeStarted), entityIds);
}

function listBehaviorEntities() {
  entityIds.length = 0;
  return executeFilterQuery(hasActLike, entityIds);
}

export function BehaviorSystem(deltaTime: number, elapsedTime: number) {
  for (const entityId of listEntitiesToBeStarted()) {
    const behavior = getActLike(entityId);
    behavior.start();
    removeEntityFrameOperation(entityId, EntityFrameOperation.START_BEHAVIOR);
  }

  for (const entityId of listBehaviorEntities()) {
    const behavior = getActLike(entityId);
    behavior.onFrame(deltaTime, elapsedTime);
  }
}
