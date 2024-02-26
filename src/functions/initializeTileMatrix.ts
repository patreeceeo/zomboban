import { executeFilterQuery } from "../Query";
import { placeObjectInTile, resetTiles } from "../Tile";
import { PositionComponent } from "../components";
import { LayerId, LayerIdComponent } from "../components/LayerId";
import { state } from "../state";

const entityIds: number[] = [];
function isOnObjectLayer(id: number): boolean {
  return (
    state.has(LayerIdComponent, id) &&
    state.is(LayerIdComponent, id, LayerId.Object)
  );
}

function listPositionedObjects(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (id: number) => {
      return isOnObjectLayer(id) && state.has(PositionComponent, id);
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
