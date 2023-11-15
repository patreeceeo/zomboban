import { invariant } from "../Error";

const DATA: Array<number> = [];

export function setVelocityX(id: number, value: number): void {
  DATA[id] = value;
}

export function hasVelocityX(id: number): boolean {
  return DATA[id] !== undefined;
}

export function getVelocityX(id: number): number {
  invariant(hasVelocityX(id), `Entity ${id} has no velocityX`);
  return DATA[id];
}

export function removeVelocityX(id: number): void {
  delete DATA[id];
}
