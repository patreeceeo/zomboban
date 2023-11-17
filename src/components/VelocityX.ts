import { invariant } from "../Error";

const DATA: Array<Pps> = [];

export function setVelocityX(id: number, value: Pps): void {
  DATA[id] = value;
}

export function hasVelocityX(id: number): boolean {
  return DATA[id] !== undefined;
}

export function getVelocityX(id: number): Pps {
  invariant(hasVelocityX(id), `Entity ${id} has no velocityX`);
  return DATA[id];
}

export function removeVelocityX(id: number): void {
  delete DATA[id];
}
