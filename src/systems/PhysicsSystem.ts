import { executeFilterQuery } from "../Query";
import {
  clearTile,
  getTileX,
  getTileY,
  placeObjectInTile,
  queryTile,
  removeObjectFromTile,
  resetTiles,
} from "../Tile";
import { amendUndo, pushEmptyUndo, hasUndo } from "../Undo";
import { ActLike, isActLike } from "../components/ActLike";
import { Layer, getLayer, hasLayer } from "../components/Layer";
import { hasPosition, setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { setToBeRemoved } from "../components/ToBeRemoved";
import { setVelocity } from "../components/Velocity";
import { getVelocityX, getVelocityXOrZero } from "../components/VelocityX";
import { getVelocityY, getVelocityYOrZero } from "../components/VelocityY";
import { isMoving } from "../functions/isMoving";
import { convertPpsToTxps, convertPpsToTyps } from "../units/convert";
import { listEntitiesToBeRemoved } from "./RemoveEntitySystem";

const entityIds: number[] = [];

/* These functions exist so that we can stop objects from moving when it's not their turn,
 * without resorting to setting their velocity to 0.
 * This is important because we want to be able to animate movement,
 * and to do that we need to move the object a little bit each frame rather than all at once.
 * It's also important because certain objects (like the potion) continue to move in whatever direction they were going
 * while other objects move one tile and stop.
 *
 * How it works: For now, all objects have a limit of 1 tile. This means that they can only move 1 tile per turn.
 * Each time an object moves, we record its displacement towards its limit. When it reaches its limit, we don't move it anymore,
 * regardless of its velocity. At the beginning of each round, we reset the displacement towards limit for all objects.
 */
const DISPLACEMENT_LIMIT = 1;
const DISPLACEMENT_TOWARDS_LIMIT_BY_ENTITY_ID: number[] = [];

function recordDisplacementTowardsLimit(id: number, displacement: number) {
  DISPLACEMENT_TOWARDS_LIMIT_BY_ENTITY_ID[id] ||= 0;
  DISPLACEMENT_TOWARDS_LIMIT_BY_ENTITY_ID[id] += displacement;
}

function getDisplacementTowardsLimit(id: number) {
  return DISPLACEMENT_TOWARDS_LIMIT_BY_ENTITY_ID[id] || 0;
}

function isAtDisplacementLimit(id: number) {
  return DISPLACEMENT_TOWARDS_LIMIT_BY_ENTITY_ID[id] >= DISPLACEMENT_LIMIT;
}

export function resetDisplacementTowardLimit() {
  DISPLACEMENT_TOWARDS_LIMIT_BY_ENTITY_ID.length = 0;
}

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

function simulateBlockVelocityBasic(id: number): void {
  const positionX = getPositionX(id);
  const positionY = getPositionY(id);
  const velocityX = getVelocityXOrZero(id);
  const velocityY = getVelocityYOrZero(id);
  const tilePositionX = getTileX(id);
  const tilePositionY = getTileY(id);
  const nextPositionX = (positionX + velocityX) as Px;
  const nextPositionY = (positionY + velocityY) as Px;
  const nextTilePositionX = getTileX(-1, nextPositionX);
  const nextTilePositionY = getTileY(-1, nextPositionY);
  const nextTileIds = queryTile(nextTilePositionX, nextTilePositionY);

  const almostCollision =
    nextTileIds.some((id) => isActLike(id, ActLike.ANY_GAME_OBJECT)) &&
    nextTileIds.some((nextId) => isAboutToCollide(id, nextId));

  const entitiesAtTile = queryTile(tilePositionX, tilePositionY);
  const collisionEntities = entitiesAtTile.filter(
    (otherId) =>
      isActLike(otherId, ActLike.ANY_GAME_OBJECT & ~ActLike.PLAYER) &&
      id !== otherId,
  );
  const collision = collisionEntities.length > 0;

  if (isActLike(id, ActLike.POTION) && collision) {
    setToBeRemoved(id, true);
  }

  if (
    (!almostCollision ||
      isActLike(id, ActLike.POTION) ||
      nextTileIds.every((id) => isActLike(id, ActLike.UNZOMBIE))) &&
    (!isAtDisplacementLimit(id) || _suspendUndoTracking)
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

    recordDisplacementTowardsLimit(
      id,
      Math.abs(convertPpsToTxps(velocityX) + convertPpsToTyps(velocityY)),
    );
  } else {
    if (isActLike(id, ActLike.PLAYER | ActLike.ZOMBIE | ActLike.PUSHABLE)) {
      setVelocity(id, 0 as Pps, 0 as Pps);
    }
  }
}

function simulateBlockVelocity(id: number): void {
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
    // Don't push when undoing or when it's already started moving
    if (!_suspendUndoTracking && getDisplacementTowardsLimit(id) === 0) {
      attemptPush(id, velocityX, velocityY);
    }
    nextTileIds.forEach(simulateBlockVelocityBasic);
  }

  simulateBlockVelocityBasic(id);
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
  const nextTilePositionX = (tilePositionX +
    convertPpsToTxps(velocityX)) as TilesX;
  const nextTilePositionY = (tilePositionY +
    convertPpsToTyps(velocityY)) as TilesY;

  for (const pushingId of queryTile(nextTilePositionX, nextTilePositionY)) {
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
    simulateBlockVelocity(id);
  }
  for (const id of listMovingObjects(ActLike.PUSHABLE)) {
    simulateBlockVelocity(id);
  }
  for (const id of listMovingObjects(ActLike.ZOMBIE)) {
    simulateBlockVelocity(id);
  }
  for (const id of listMovingObjects(ActLike.POTION)) {
    simulateBlockVelocity(id);
  }
  for (const id of listEntitiesToBeRemoved()) {
    if (isObject(id)) {
      removeObjectFromTile(id, getTileX(id), getTileY(id));
    }
  }
}

// TODO use this in collision detection?
// const OPPOSING_VELOCITY_SIGNS: boolean[][][][] = []
// for(let i = -1; i <= 1; i++) {
//   OPPOSING_VELOCITY_SIGNS[i] = [];
//   for(let j = -1; j <= 1; j++) {
//     OPPOSING_VELOCITY_SIGNS[i][j] = [];
//     for(let k = -1; k <= 1; k++) {
//       OPPOSING_VELOCITY_SIGNS[i][j][k] = [];
//       for(let l = -1; l <= 1; l++) {
//         OPPOSING_VELOCITY_SIGNS[i][j][k][l] = false;
//       }
//     }
//   }
// }
// OPPOSING_VELOCITY_SIGNS[1][0][0][0] = true;
// OPPOSING_VELOCITY_SIGNS[-1][0][0][0] = true;
// OPPOSING_VELOCITY_SIGNS[1][0][-1][0] = true;

// function hasOpposingVelocity(aVelocityX: Pps, aVelocityY: Pps, bVelocityX: Pps, bVelocityY: Pps): boolean {
//   const aSignX = Math.sign(aVelocityX);
//   const bSignX = Math.sign(bVelocityX);
//   const aSignY = Math.sign(aVelocityY);
//   const bSignY = Math.sign(bVelocityY);
//   return OPPOSING_VELOCITY_SIGNS[aSignX][aSignY][bSignX][bSignY] || OPPOSING_VELOCITY_SIGNS[bSignX][bSignY][aSignX][aSignY] ||
//     OPPOSING_VELOCITY_SIGNS[aSignY][aSignX][bSignY][bSignX] || OPPOSING_VELOCITY_SIGNS[bSignY][bSignX][aSignY][aSignX]
// }
