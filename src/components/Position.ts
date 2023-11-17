import {
  getPositionX,
  hasPositionX,
  removePositionX,
  setPositionX,
} from "./PositionX";
import {
  getPositionY,
  hasPositionY,
  removePositionY,
  setPositionY,
} from "./PositionY";

export function setPosition(entityId: number, x: Px, y: Px) {
  setPositionX(entityId, x);
  setPositionY(entityId, y);
}

export function hasPosition(entityId: number): boolean {
  return hasPositionX(entityId) && hasPositionY(entityId);
}

export function isPosition(entityId: number, x: number, y: number): boolean {
  return getPositionX(entityId) === x && getPositionY(entityId) === y;
}

export function removePosition(entityId: number): void {
  removePositionX(entityId);
  removePositionY(entityId);
}
