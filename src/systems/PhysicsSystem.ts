import { Matrix } from "../Matrix";
import { executeFilterQuery } from "../Query";
import { Layer, getLayer, hasLayer } from "../components/Layer";
import { hasPosition, setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { SPRITE_SIZE } from "../components/Sprite";
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

function getMovingObjectsX(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((id: number) => {
    return (
      isObject(id) &&
      hasPosition(id) &&
      hasVelocityX(id) &&
      getVelocityX(id) !== 0
    );
  }, entityIds);
}

function getMovingObjectsY(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((id: number) => {
    return (
      isObject(id) &&
      hasPosition(id) &&
      hasVelocityY(id) &&
      getVelocityY(id) !== 0
    );
  }, entityIds);
}

function simulateVelocity(id: number, direction: "x" | "y"): void {
  const positionX = getPositionX(id);
  const positionY = getPositionY(id);
  const tilePositionX = calcTilePosition(positionX);
  const tilePositionY = calcTilePosition(positionY);
  const nextPositionX =
    direction === "x" ? positionX + getVelocityX(id) : positionX;
  const nextPositionY =
    direction === "y" ? positionY + getVelocityY(id) : positionY;
  const nextTilePositionX = calcTilePosition(nextPositionX);
  const nextTilePositionY = calcTilePosition(nextPositionY);
  if (!OBJECT_POSITION_MATRIX.has(nextTilePositionX, nextTilePositionY)) {
    OBJECT_POSITION_MATRIX.delete(tilePositionX, tilePositionY);
    OBJECT_POSITION_MATRIX.set(nextTilePositionX, nextTilePositionY, id);
    setPosition(id, nextPositionX, nextPositionY);
  }

  direction === "x" ? setVelocityX(id, 0) : setVelocityY(id, 0);
}

export function initializePhysicsSystem(): void {
  OBJECT_POSITION_MATRIX.reset();
  for (const id of getPositionedObjects()) {
    addObjectToMatrix(id);
  }
}

export function PhysicsSystem(): void {
  for (const id of getMovingObjectsX()) {
    simulateVelocity(id, "x");
  }
  for (const id of getMovingObjectsY()) {
    simulateVelocity(id, "y");
  }
}
