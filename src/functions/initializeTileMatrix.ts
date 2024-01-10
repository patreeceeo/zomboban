import { executeFilterQuery } from "../Query";
import { placeObjectInTile, resetTiles } from "../Tile";
import { Layer, getLayer } from "../components/Layer";
import { hasPosition } from "../components/Position";

const entityIds: number[] = [];
function isOnObjectLayer(id: number): boolean {
  return getLayer(id) === Layer.OBJECT;
}

function listPositionedObjects(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((id: number) => {
    return isOnObjectLayer(id) && hasPosition(id);
  }, entityIds);
}
export function initializeTileMatrix(): void {
  resetTiles();
  for (const id of listPositionedObjects()) {
    placeObjectInTile(id);
  }
}
