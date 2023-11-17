import { invariant } from "../Error";

const DATA: Array<Pps> = [];

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

export function removeVelocityY(id: number): void {
  delete DATA[id];
}
