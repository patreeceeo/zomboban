import { plotLineSegment } from "../LineSegment";
import { Matrix } from "../Matrix";
import { executeFilterQuery } from "../Query";
import { ActLike, isActLike } from "../components/ActLike";
import { Layer, getLayer, hasLayer } from "../components/Layer";
import { hasPosition, setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { setVelocity } from "../components/Velocity";
import { getVelocityX } from "../components/VelocityX";
import { getVelocityY } from "../components/VelocityY";
import { isMoving } from "../functions/isMoving";
import { convertPixelsToTilesX, convertPixelsToTilesY } from "../units/convert";

const entityIds: number[] = [];
const OBJECT_POSITION_MATRIX = new Matrix<number>();

function isObject(id: number): boolean {
  return hasLayer(id) && getLayer(id) === Layer.OBJECT;
}

function calcTilePositionX(position: Px): number {
  return Math.round(convertPixelsToTilesX(position));
}
function calcTilePositionY(position: Px): number {
  return Math.round(convertPixelsToTilesY(position));
}

function addObjectToMatrix(id: number): void {
  const x = calcTilePositionX(getPositionX(id));
  const y = calcTilePositionY(getPositionY(id));
  OBJECT_POSITION_MATRIX.set(x, y, id);
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

function simulateVelocity(id: number): void {
  const positionX = getPositionX(id);
  const positionY = getPositionY(id);
  const velocityX = getVelocityX(id);
  const velocityY = getVelocityY(id);
  const tilePositionX = calcTilePositionX(positionX);
  const tilePositionY = calcTilePositionY(positionY);
  const nextPositionX = (positionX + velocityX) as Px;
  const nextPositionY = (positionY + velocityY) as Px;
  const nextTilePositionX = calcTilePositionX(nextPositionX);
  const nextTilePositionY = calcTilePositionY(nextPositionY);
  const pushingId = OBJECT_POSITION_MATRIX.get(
    nextTilePositionX,
    nextTilePositionY,
  );

  // Allow pushable to move before player. Necessary to allow them to move together.
  // Also, in order for undo to work, we sometimes need to allow the player to move before the pushable.
  // Note that this condition is looser than it needs to be, but it's not worth the effort to make it more precise
  // since there's only ever one player, for now.
  if (
    isActLike(id, ActLike.PLAYER | ActLike.PUSHABLE) &&
    isActLike(pushingId, ActLike.PUSHABLE | ActLike.PLAYER) &&
    isMoving(pushingId)
  ) {
    // TODO: refactor to not be recursive?
    simulateVelocity(pushingId);
  }

  if (
    !isActLike(pushingId, ActLike.BARRIER) &&
    !isLineObstructed(
      tilePositionX,
      tilePositionY,
      nextTilePositionX,
      nextTilePositionY,
    )
  ) {
    // move object
    OBJECT_POSITION_MATRIX.delete(tilePositionX, tilePositionY);
    OBJECT_POSITION_MATRIX.set(nextTilePositionX, nextTilePositionY, id);
    setPosition(id, nextPositionX as Px, nextPositionY as Px);
  }

  setVelocity(id, 0 as Pps, 0 as Pps);
}

export function listObjectsAt(
  tileX: TilesX,
  tileY: TilesY,
  result: number[],
): ReadonlyArray<number> {
  result.push(OBJECT_POSITION_MATRIX.get(tileX, tileY));
  return result;
}

function isTileActLike(
  tileX: number,
  tileY: number,
  actLikeMask: number,
): boolean {
  const objectId = OBJECT_POSITION_MATRIX.get(tileX, tileY);
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

export function initializePhysicsSystem(): void {
  OBJECT_POSITION_MATRIX.reset();
  for (const id of getPositionedObjects()) {
    addObjectToMatrix(id);
  }
}

export function PhysicsSystem(): void {
  for (const id of listMovingObjects()) {
    simulateVelocity(id);
  }
}
