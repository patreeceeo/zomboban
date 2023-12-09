import { executeFilterQuery } from "../Query";
import {
  clearTile,
  getTileX,
  getTileY,
  placeObjectInTile,
  queryTile,
  resetTiles,
} from "../Tile";
import { amendUndo, pushEmptyUndo, hasUndo } from "../Undo";
import { ActLike, isActLike } from "../components/ActLike";
import { Layer, getLayer, hasLayer } from "../components/Layer";
import { hasPosition, setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { setVelocity } from "../components/Velocity";
import { getVelocityX, getVelocityXOrZero } from "../components/VelocityX";
import { getVelocityY, getVelocityYOrZero } from "../components/VelocityY";
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

function listMovingObjects(actLikeMask: number): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((id: number) => {
    return isObject(id) && isMoving(id) && isActLike(id, actLikeMask);
  }, entityIds);
}

function isPusher(id: number): boolean {
  return isActLike(id, ActLike.PLAYER | ActLike.ZOMBIE);
}
function isPushable(id: number): boolean {
  return isActLike(id, ActLike.PUSHABLE);
}

function simulateVelocityBasic(id: number): void {
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
  const nextTileIds = queryTile(nextTilePositionX, nextTilePositionY);

  if (
    !nextTileIds.some((id) => isActLike(id, ActLike.ANY_GAME_OBJECT)) ||
    !nextTileIds.some((nextId) => isAboutToCollide(id, nextId))
  ) {
    // move object
    if (_requestUndo) {
      pushEmptyUndo();
      _requestUndo = false;
    }
    if (hasUndo() && !_suspendUndoTracking) {
      amendUndo([id]);
    }
    clearTile(tilePositionX, tilePositionY);
    placeObjectInTile(id, nextTilePositionX, nextTilePositionY);
    setPosition(id, nextPositionX as Px, nextPositionY as Px);
  }

  setVelocity(id, 0 as Pps, 0 as Pps);
}

function isAboutToCollide(aId: number, bId: number): boolean {
  const aPositionX = getPositionX(aId);
  const aPositionY = getPositionY(aId);
  const bPositionX = getPositionX(bId);
  const bPositionY = getPositionY(bId);
  const aVelocityX = getVelocityXOrZero(aId);
  const aVelocityY = getVelocityYOrZero(aId);
  const bVelocityX = getVelocityXOrZero(bId);
  const bVelocityY = getVelocityYOrZero(bId);
  const aNextPositionX = (aPositionX + aVelocityX) as Px;
  const aNextPositionY = (aPositionY + aVelocityY) as Px;
  const bNextPositionX = (bPositionX + bVelocityX) as Px;
  const bNextPositionY = (bPositionY + bVelocityY) as Px;
  const aNextTilePositionX = getTileX(-1, aNextPositionX);
  const aNextTilePositionY = getTileY(-1, aNextPositionY);
  const bNextTilePositionX = getTileX(-1, bNextPositionX);
  const bNextTilePositionY = getTileY(-1, bNextPositionY);

  const aSignX = Math.sign(aVelocityX);
  const bSignX = Math.sign(bVelocityX);
  const aSignY = Math.sign(aVelocityY);
  const bSignY = Math.sign(bVelocityY);
  return (
    (aNextTilePositionX === bNextTilePositionX &&
      aNextTilePositionY === bNextTilePositionY) ||
    // detect swapping places
    (aSignX !== 0 && aSignX === -bSignX && aSignY === 0 && bSignY === 0) ||
    (aSignY !== 0 && aSignY === -bSignY && aSignX === 0 && bSignX === 0)
  );
}

function simulateVelocity(id: number): void {
  const positionX = getPositionX(id);
  const positionY = getPositionY(id);
  const velocityX = getVelocityX(id);
  const velocityY = getVelocityY(id);
  const nextPositionX = (positionX + velocityX) as Px;
  const nextPositionY = (positionY + velocityY) as Px;
  const nextTilePositionX = getTileX(-1, nextPositionX);
  const nextTilePositionY = getTileY(-1, nextPositionY);
  const nextTileIds = queryTile(nextTilePositionX, nextTilePositionY);

  // Allow pushable to move before player. Necessary to allow them to move together.
  // Also, in order for undo to work, we sometimes need to allow the player to move before the pushable.
  // Note that this condition is looser than it needs to be, but it's not worth the effort to make it more precise
  // since there's only ever one player, for now.
  if (
    (isPusher(id) && nextTileIds.every(isPushable)) ||
    !nextTileIds.some((nextId) => isAboutToCollide(id, nextId))
  ) {
    // TODO I broke undo when I moved this here.
    attemptPush(id, velocityX, velocityY);
    nextTileIds.forEach(simulateVelocityBasic);
  }

  simulateVelocityBasic(id);
}

function isTileActLike(
  tileX: number,
  tileY: number,
  actLikeMask: number,
): boolean {
  const objectIds = queryTile(tileX as TilesX, tileY as TilesY);
  return objectIds.some((id) => isActLike(id, actLikeMask));
}

export function isLineObstructed(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  actLikeMask = ActLike.ANY_GAME_OBJECT,
): boolean {
  const dx = endX - startX;
  const dy = endY - startY;
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  if (dx === 0 && dy === 0) {
    return false;
  }
  if (dx === 0 && dy !== 0) {
    for (let y = startY; y !== endY; y += sy) {
      if (isTileActLike(startX, y, actLikeMask)) {
        return true;
      }
    }
    return false;
  }
  if (dx !== 0 && dy === 0) {
    for (let x = startX; x !== endX; x += sx) {
      if (isTileActLike(x, startY, actLikeMask)) {
        return true;
      }
    }
    return false;
  }

  return true;
}

export function attemptPush(
  id: number,
  velocityX = getVelocityX(id),
  velocityY = getVelocityY(id),
): void {
  const tilePositionX = getTileX(id);
  const tilePositionY = getTileY(id);

  for (const pushingId of queryTile(
    (tilePositionX + convertPpsToTxps(velocityX)) as TilesX,
    (tilePositionY + convertPpsToTyps(velocityY)) as TilesY,
  )) {
    setVelocity(pushingId, velocityX, velocityY);
  }
}

export function initializePhysicsSystem(): void {
  resetTiles();
  for (const id of getPositionedObjects()) {
    placeObjectInTile(id);
  }
}

let _requestUndo = false;
export function requestUndo() {
  _requestUndo = true;
}

let _suspendUndoTracking = false;
export function suspendUndoTracking(boolean: boolean) {
  _suspendUndoTracking = boolean;
}

export function PhysicsSystem(): void {
  for (const id of listMovingObjects(ActLike.PLAYER)) {
    simulateVelocity(id);
  }
  for (const id of listMovingObjects(ActLike.PUSHABLE)) {
    simulateVelocity(id);
  }
  for (const id of listMovingObjects(ActLike.ZOMBIE)) {
    simulateVelocity(id);
  }
}
