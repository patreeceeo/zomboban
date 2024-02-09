import { executeFilterQuery } from "../Query";
import { placeObjectInTile, resetTiles } from "../Tile";
import { LayerId } from "../components/Layer";
import { state } from "../state";

const entityIds: number[] = [];
function isOnObjectLayer(id: number): boolean {
  return state.isOnLayer(id, LayerId.Object);
}

function listPositionedObjects(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (id: number) => {
      return (
        isOnObjectLayer(id) && state.hasPositionX(id) && state.hasPositionY(id)
      );
    },
    entityIds,
    state.addedEntities,
  );
}
export function initializeTileMatrix(): void {
  resetTiles();
  for (const id of listPositionedObjects()) {
    placeObjectInTile(id);
  }
}
