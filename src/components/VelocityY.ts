import { defineComponent } from "../Component";
import { invariant } from "../Error";

const DATA = defineComponent(
  "VelocityY",
  [],
  hasVelocityY,
  getVelocityY,
  setVelocityY,
  removeVelocityY,
);

export function setVelocityY(id: number, value: Pps): void {
  DATA[id] = value;
}

export function hasVelocityY(id: number): boolean {
  return DATA[id] !== undefined;
}

export function getVelocityY(id: number): Pps {
  invariant(hasVelocityY(id), `Entity ${id} has no velocityY`);
  return DATA[id];
}

export function getVelocityYOrZero(id: number): Pps {
  return DATA[id] || (0 as Pps);
}

export function removeVelocityY(id: number): void {
  delete DATA[id];
}
