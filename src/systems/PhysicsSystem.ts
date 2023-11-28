import { plotLineSegment } from "../LineSegment";
import { executeFilterQuery } from "../Query";
import {
  clearTile,
  getTileX,
  getTileY,
  placeObjectInTile,
  queryTile,
  resetTiles,
} from "../Tile";
import { ActLike, isActLike } from "../components/ActLike";
import { Layer, getLayer, hasLayer } from "../components/Layer";
import { hasPosition, setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { setVelocity } from "../components/Velocity";
import { getVelocityX } from "../components/VelocityX";
import { getVelocityY } from "../components/VelocityY";
import { isMoving } from "../functions/isMoving";
import { convertPpsToTxps, convertPpsToTyps } from "../units/convert";

const entityIds: number[] = [];

function isObject(id: number): boolean {
  return hasLayer(id) && getLayer(id) === Layer.OBJECT;
}

function getPositionedObjects(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((id: number) => {
    return isObject(id) && hasPosition(id);
  }, entityIds);
}

function listMovingObjects(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((id: number) => {
    return isObject(id) && isMoving(id);
  }, entityIds);
}

function isPlayerOrPushable(id: number): boolean {
  return isActLike(id, ActLike.PLAYER | ActLike.PUSHABLE);
}

function simulateVelocity(id: number): void {
  const positionX = getPositionX(id);
  const positionY = getPositionY(id);
  const velocityX = getVelocityX(id);
  const velocityY = getVelocityY(id);
  const tilePositionX = getTileX(id);
  const tilePositionY = getTileY(id);
  const nextPositionX = (positionX + velocityX) as Px;
  const nextPositionY = (positionY + velocityY) as Px;
  const nextTilePositionX = getTileX(-1, nextPositionX);
  const nextTilePositionY = getTileY(-1, nextPositionY);
  const nextTileId = queryTile(nextTilePositionX, nextTilePositionY);

  // Allow pushable to move before player. Necessary to allow them to move together.
  // Also, in order for undo to work, we sometimes need to allow the player to move before the pushable.
  // Note that this condition is looser than it needs to be, but it's not worth the effort to make it more precise
  // since there's only ever one player, for now.
  if (
    isPlayerOrPushable(id) &&
    isPlayerOrPushable(nextTileId) &&
    isMoving(nextTileId)
  ) {
    // TODO: refactor to not be recursive?
    simulateVelocity(nextTileId);
  }

  if (
    !isActLike(nextTileId, ActLike.BARRIER) &&
    !isLineObstructed(
      tilePositionX,
      tilePositionY,
      nextTilePositionX,
      nextTilePositionY,
    )
  ) {
    // move object
    clearTile(tilePositionX, tilePositionY);
    placeObjectInTile(id, nextTilePositionX, nextTilePositionY);
    setPosition(id, nextPositionX as Px, nextPositionY as Px);
  }

  setVelocity(id, 0 as Pps, 0 as Pps);
}

function isTileActLike(
  tileX: number,
  tileY: number,
  actLikeMask: number,
): boolean {
  const objectId = queryTile(tileX as TilesX, tileY as TilesY);
  return isActLike(objectId, actLikeMask);
}

export function isLineObstructed(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  actLikeMask = ActLike.ANY_GAME_OBJECT,
): boolean {
  const lineSegment = plotLineSegment(startX, startY, endX, endY);
  lineSegment.next();
  for (const [tileX, tileY] of lineSegment) {
    if (isTileActLike(tileX, tileY, actLikeMask)) {
      return true;
    }
    const sx = Math.sign(endX - startX);
    const sy = Math.sign(endY - startY);
    let count = 0;
    if (sx > 0 && isTileActLike(tileX - 1, tileY, actLikeMask)) {
      count++;
    }
    if (sx < 0 && isTileActLike(tileX + 1, tileY, actLikeMask)) {
      count++;
    }
    if (sy > 0 && isTileActLike(tileX, tileY - 1, actLikeMask)) {
      count++;
    }
    if (sy < 0 && isTileActLike(tileX, tileY + 1, actLikeMask)) {
      count++;
    }
    if (count > 1) {
      return true;
    }
  }
  return false;
}

export function attemptPush(
  id: number,
  velocityX = getVelocityX(id),
  velocityY = getVelocityY(id),
): void {
  const tilePositionX = getTileX(id);
  const tilePositionY = getTileY(id);

  const pushingId = queryTile(
    (tilePositionX + convertPpsToTxps(velocityX)) as TilesX,
    (tilePositionY + convertPpsToTyps(velocityY)) as TilesY,
  );
  if (isActLike(pushingId, ActLike.PUSHABLE)) {
    setVelocity(pushingId, velocityX, velocityY);
  }
}

export function initializePhysicsSystem(): void {
  resetTiles();
  for (const id of getPositionedObjects()) {
    placeObjectInTile(id);
  }
}

export function PhysicsSystem(): void {
  for (const id of listMovingObjects()) {
    simulateVelocity(id);
  }
}
