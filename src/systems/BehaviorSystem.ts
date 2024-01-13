import { listRemovedEntities } from "../Entity";
import { and, executeFilterQuery } from "../Query";
import { Behavior, getActLike, hasActLike } from "../components/ActLike";

const entityIds: number[] = [];

function isBehaviorStopped(entityId: number) {
  return !getActLike(entityId).isStarted;
}

function listBehaviorsToBeStarted() {
  entityIds.length = 0;
  return executeFilterQuery(and(hasActLike, isBehaviorStopped), entityIds).map(
    getActLike,
  );
}

function listBehaviorsOfRemovedEntities() {
  entityIds.length = 0;
  return executeFilterQuery(hasActLike, entityIds, listRemovedEntities()).map(
    getActLike,
  );
}

const STARTED_BEHAVIORS: Behavior[] = [];

export function BehaviorSystem(deltaTime: number, elapsedTime: number) {
  for (const behavior of listBehaviorsOfRemovedEntities()) {
    behavior.stop();
    delete STARTED_BEHAVIORS[behavior.entityId];
  }

  for (const behavior of listBehaviorsToBeStarted()) {
    behavior.start();
    STARTED_BEHAVIORS[behavior.entityId] = behavior;
  }

  for (const behavior of STARTED_BEHAVIORS) {
    if (behavior !== undefined) {
      behavior.onFrame(deltaTime, elapsedTime);
    }
  }
}
