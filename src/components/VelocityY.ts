import { invariant } from "../Error";

const DATA: Array<number> = [];

export function setVelocityY(id: number, value: number): void {
  DATA[id] = value;
}

export function hasVelocityY(id: number): boolean {
  return DATA[id] !== undefined;
}

export function getVelocityY(id: number): number {
  invariant(hasVelocityY(id), `Entity ${id} has no velocityY`);
  return DATA[id];
}
