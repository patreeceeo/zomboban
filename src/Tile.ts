import { Matrix } from "./Matrix";
import { getPositionX } from "./components/PositionX";
import { getPositionY } from "./components/PositionY";
import { convertPixelsToTilesX, convertPixelsToTilesY } from "./units/convert";

const OBJECT_TILE_MATRIX = new Matrix<Set<number>>();

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

export function resetTiles(): void {
  OBJECT_TILE_MATRIX.reset();
}

function listAdjacentTiles(
  tileX: TilesX,
  tileY: TilesY,
  target: [TilesX, TilesY][] = [],
): [TilesX, TilesY][] {
  for (let yDiff = -1; yDiff <= 1; yDiff++) {
    for (let xDiff = -1; xDiff <= 1; xDiff++) {
      if (xDiff !== 0 && yDiff !== 0) {
        continue;
      }
      target.push([(tileX + xDiff) as TilesX, (tileY + yDiff) as TilesY]);
    }
  }
  return target;
}

export function listAdjacentTileEntities(
  tileX: TilesX,
  tileY: TilesY,
  target: number[] = [],
): number[] {
  for (const [x, y] of listAdjacentTiles(tileX, tileY)) {
    queryTile(x, y, target);
  }
  return target;
}
