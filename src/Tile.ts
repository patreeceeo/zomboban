import { Matrix } from "./Matrix";
import { getPositionX } from "./components/PositionX";
import { getPositionY } from "./components/PositionY";
import { convertPixelsToTilesX, convertPixelsToTilesY } from "./units/convert";

const OBJECT_TILE_MATRIX = new Matrix<Set<number>>();

class Collision {
  #otherIds: number[] = [];
  constructor(readonly entityId: number) {}
  addOther(otherId: number) {
    this.#otherIds.push(otherId);
  }
  get otherIds(): ReadonlyArray<number> {
    return this.#otherIds;
  }
}

const collisionById: Record<number, Collision> = {};

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
  const otherIds = OBJECT_TILE_MATRIX.get(x, y);
  if (otherIds && otherIds.size > 0) {
    const collision =
      collisionById[id] || (collisionById[id] = new Collision(id));
    for (const otherId of otherIds) {
      collision.addOther(otherId);
      const otherCollision =
        collisionById[otherId] ||
        (collisionById[otherId] = new Collision(otherId));
      otherCollision.addOther(id);
    }
  }
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

export function getCollisions() {
  return Object.values(collisionById);
}

export function resetCollisions() {
  for (const key in collisionById) {
    delete collisionById[key];
  }
}
