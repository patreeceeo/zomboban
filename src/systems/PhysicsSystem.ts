import { Matrix } from "../Matrix";
import { executeFilterQuery } from "../Query";
import { Layer, getLayer, hasLayer } from "../components/Layer";
import { hasPosition, setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { SPRITE_SIZE } from "../components/Sprite";
import { setVelocity } from "../components/Velocity";
import {
  getVelocityX,
  hasVelocityX,
  setVelocityX,
} from "../components/VelocityX";
import {
  getVelocityY,
  hasVelocityY,
  setVelocityY,
} from "../components/VelocityY";

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
  const tilePositionX = calcTilePosition(positionX);
  const tilePositionY = calcTilePosition(positionY);
  const nextPositionX = positionX + getVelocityX(id);
  const nextPositionY = positionY + getVelocityY(id);
  const nextTilePositionX = calcTilePosition(nextPositionX);
  const nextTilePositionY = calcTilePosition(nextPositionY);
  if (!OBJECT_POSITION_MATRIX.has(nextTilePositionX, nextTilePositionY)) {
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
