import { plotLineSegment } from "../LineSegment";
import { Matrix } from "../Matrix";
import { executeFilterQuery } from "../Query";
import {
  ActLike,
  getActLike,
  isActLike,
  stringifyActLike,
} from "../components/ActLike";
import { Layer, getLayer, hasLayer } from "../components/Layer";
import { hasPosition, setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { SPRITE_SIZE } from "../components/Sprite";
import { setVelocity } from "../components/Velocity";
import { getVelocityX, hasVelocityX } from "../components/VelocityX";
import { getVelocityY, hasVelocityY } from "../components/VelocityY";

const entityIds: number[] = [];
const OBJECT_POSITION_MATRIX = new Matrix<number>();

function isObject(id: number): boolean {
  return hasLayer(id) && getLayer(id) === Layer.OBJECT;
}

function calcTilePosition(positionX: number): number {
  return Math.round(positionX / SPRITE_SIZE);
}

function addObjectToMatrix(id: number): void {
  const x = calcTilePosition(getPositionX(id));
  const y = calcTilePosition(getPositionY(id));
  OBJECT_POSITION_MATRIX.set(x, y, id);
}

function getPositionedObjects(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((id: number) => {
    return isObject(id) && hasPosition(id);
  }, entityIds);
}

function getMovingObjects(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((id: number) => {
    return (
      (isObject(id) &&
        hasPosition(id) &&
        hasVelocityY(id) &&
        getVelocityY(id) !== 0) ||
      (hasVelocityX(id) && getVelocityX(id) !== 0)
    );
  }, entityIds);
}

function simulateVelocity(id: number): void {
  const positionX = getPositionX(id);
  const positionY = getPositionY(id);
  const velocityX = getVelocityX(id);
  const velocityY = getVelocityY(id);
  const tilePositionX = calcTilePosition(positionX);
  const tilePositionY = calcTilePosition(positionY);
  const nextPositionX = positionX + velocityX;
  const nextPositionY = positionY + velocityY;
  const nextTilePositionX = calcTilePosition(nextPositionX);
  const nextTilePositionY = calcTilePosition(nextPositionY);
  const iActLike = getActLike(id);
  const adjObjectId = OBJECT_POSITION_MATRIX.get(
    nextTilePositionX,
    nextTilePositionY,
  );
  const adjObjectActLike = getActLike(adjObjectId);

  if (adjObjectActLike === ActLike.PUSHABLE) {
    if (iActLike === ActLike.PLAYER) {
      // start the push
      setVelocity(adjObjectId, velocityX, velocityY);
      simulateVelocity(adjObjectId);
    }
  }
  if (
    !isActLike(adjObjectId, ActLike.BARRIER) &&
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
    setPosition(id, nextPositionX, nextPositionY);
  }

  setVelocity(id, 0, 0);
}

export function getObjectsAt(
  tileX: number,
  tileY: number,
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
  for (const id of getMovingObjects()) {
    simulateVelocity(id);
  }
}
