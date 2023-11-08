import { Matrix } from "../Matrix";
import { executeFilterQuery } from "../Query";
import { Layer, getLayer, hasLayer } from "../components/Layer";
import { hasPosition, setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { SPRITE_SIZE } from "../components/Sprite";
import { hasVelocity, setVelocity } from "../components/Velocity";
import { getVelocityX } from "../components/VelocityX";
import { getVelocityY } from "../components/VelocityY";

const entityIds: number[] = [];
const OBJECT_POSITION_MATRIX = new Matrix<number>();

function isObject(id: number): boolean {
  return hasLayer(id) && getLayer(id) === Layer.OBJECT;
}

function calcTilePositionX(positionX: number): number {
  return Math.round(positionX / SPRITE_SIZE);
}
function calcTilePositionY(positionY: number): number {
  return Math.round(positionY / SPRITE_SIZE);
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

function getMovingObjects(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((id: number) => {
    return (
      isObject(id) &&
      hasVelocity(id) &&
      (getVelocityX(id) !== 0 || getVelocityY(id) !== 0)
    );
  }, entityIds);
}

export function initializePhysicsSystem(): void {
  for (const id of getPositionedObjects()) {
    addObjectToMatrix(id);
  }
}

// TODO replace the other function with this one
export function getObjectsOnTile(
  xTile: number,
  yTile: number,
): ReadonlyArray<number> {
  entityIds.length = 0;
  const id = OBJECT_POSITION_MATRIX.get(xTile, yTile);
  if (id !== undefined) {
    entityIds.push(id!);
  }
  return entityIds;
}

export function PhysicsSystem(): void {
  for (const id of getMovingObjects()) {
    const positionX = getPositionX(id);
    const positionY = getPositionY(id);
    const tilePositionX = calcTilePositionX(positionX);
    const tilePositionY = calcTilePositionY(positionY);
    const velocityX = getVelocityX(id);
    const velocityY = getVelocityY(id);
    const nextTilePositionX = calcTilePositionX(positionX + velocityX);
    const nextTilePositionY = calcTilePositionY(positionY + velocityY);
    if (!OBJECT_POSITION_MATRIX.has(nextTilePositionX, nextTilePositionY)) {
      OBJECT_POSITION_MATRIX.delete(tilePositionX, tilePositionY);
      OBJECT_POSITION_MATRIX.set(nextTilePositionX, nextTilePositionY, id);
      setPosition(id, positionX + velocityX, positionY + velocityY);
      setVelocity(id, 0, 0);
    }
  }
}
