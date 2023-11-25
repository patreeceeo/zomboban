import { hasVelocity } from "../components/Velocity";
import { getVelocityX } from "../components/VelocityX";
import { getVelocityY } from "../components/VelocityY";

export function isMoving(id: number) {
  return hasVelocity(id) && (getVelocityX(id) !== 0 || getVelocityY(id) !== 0);
}
