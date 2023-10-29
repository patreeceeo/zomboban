import {setPositionX} from "./PositionX";
import {setPositionY} from "./PositionY";

export function setPosition(entityId: number, x: number, y: number) {
  setPositionX(entityId, x);
  setPositionY(entityId, y)
}
