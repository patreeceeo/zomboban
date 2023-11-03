import {getPositionX, hasPositionX, setPositionX} from "./PositionX";
import {getPositionY, hasPositionY, setPositionY} from "./PositionY";

export function setPosition(entityId: number, x: number, y: number) {
  setPositionX(entityId, x);
  setPositionY(entityId, y)
}

export function hasPosition(entityId: number): boolean {
  return hasPositionX(entityId) && hasPositionY(entityId);
}

export function isPosition(entityId: number, x: number, y: number): boolean {
  return getPositionX(entityId) === x && getPositionY(entityId) === y;
}
