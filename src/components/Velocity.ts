import { hasVelocityX, setVelocityX } from "./VelocityX";
import { hasVelocityY, setVelocityY } from "./VelocityY";

export function setVelocity(id: number, x: number, y: number): void {
  setVelocityX(id, x);
  setVelocityY(id, y);
}

export function hasVelocity(id: number): boolean {
  return hasVelocityX(id) && hasVelocityY(id);
}
