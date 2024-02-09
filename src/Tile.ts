import { Matrix } from "./Matrix";
import { state } from "./state";
import { convertPixelsToTilesX, convertPixelsToTilesY } from "./units/convert";

const OBJECT_TILE_MATRIX = new Matrix<Set<number>>();

const { getPositionX, getPositionY } = state;

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
  OBJECT_TILE_MATRIX.set(x, y, OBJECT_TILE_MATRIX.get(x, y) || new Set()).add(
    id,
  );
}

export function removeObjectFromTile(
  id: number,
  x = getTileX(id),
  y = getTileY(id),
): void {
  const tile = OBJECT_TILE_MATRIX.get(x, y);
  if (tile) {
    tile.delete(id);
    if (tile.size === 0) {
      OBJECT_TILE_MATRIX.delete(x, y);
    }
  }
}

export function clearTile(tileX: TilesX, tileY: TilesY): void {
  OBJECT_TILE_MATRIX.delete(tileX, tileY);
}

export function queryTile(
  tileX: TilesX,
  tileY: TilesY,
  target: number[] = [],
): number[] {
  if (OBJECT_TILE_MATRIX.has(tileX, tileY)) {
    target.push(...OBJECT_TILE_MATRIX.get(tileX, tileY));
  }
  return target;
}

export function isTileOccupied(tileX: TilesX, tileY: TilesY): boolean {
  return OBJECT_TILE_MATRIX.has(tileX, tileY);
}

export function resetTiles(): void {
  OBJECT_TILE_MATRIX.reset();
}
