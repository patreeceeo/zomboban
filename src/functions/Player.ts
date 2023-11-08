import { executeFilterQuery } from "../Query";
import { ActLike, isActLike } from "../components/ActLike";

const entityIds: number[] = [];
export function getPlayerIfExists(): number | undefined {
  entityIds.length = 0;
  executeFilterQuery(
    (entityId) => isActLike(entityId, ActLike.PLAYER),
    entityIds,
  );
  return entityIds[0];
}
