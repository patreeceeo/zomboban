import { Matrix } from "./Matrix";
import { getPositionX } from "./components/PositionX";
import { getPositionY } from "./components/PositionY";
import { convertPixelsToTilesX, convertPixelsToTilesY } from "./units/convert";

const OBJECT_TILE_MATRIX = new Matrix<number>();

export function getTileX(id: number, x: Px = getPositionX(id)) {
  return Math.round(convertPixelsToTilesX(x)) as TilesX;
}

export function getTileY(id: number, y: Px = getPositionY(id)) {
  return Math.round(convertPixelsToTilesY(y)) as TilesY;
}

export function placeObjectInTile(
  id: number,
  x = getTileX(id),
  y = getTileY(id),
): void {
  OBJECT_TILE_MATRIX.set(x, y, id);
}

export function clearTile(tileX: TilesX, tileY: TilesY): void {
  OBJECT_TILE_MATRIX.delete(tileX, tileY);
}

export function queryTile(tileX: TilesX, tileY: TilesY): number {
  return OBJECT_TILE_MATRIX.get(tileX, tileY);
}

export function resetTiles(): void {
  OBJECT_TILE_MATRIX.reset();
}
