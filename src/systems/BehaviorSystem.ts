import { executeFilterQuery } from "../Query";
import { getActLike, hasActLike } from "../components/ActLike";

const entityIds: number[] = [];
function listBehaviorEntities() {
  entityIds.length = 0;
  return executeFilterQuery(hasActLike, entityIds);
}

export function BehaviorSystem(deltaTime: number, elapsedTime: number) {
  for (const entityId of listBehaviorEntities()) {
    const behavior = getActLike(entityId);
    behavior.onFrame(deltaTime, elapsedTime);
  }
}
