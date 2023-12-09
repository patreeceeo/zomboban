import { ComponentName, initComponentData } from "../ComponentData";
import { invariant } from "../Error";

const NAME = ComponentName.Tint;
const DATA = initComponentData(NAME, []) as number[];

export function setTint(entityId: number, tint: number) {
  DATA[entityId] = tint;
}

export function hasTint(entityId: number) {
  return DATA[entityId] !== undefined;
}

export function getTint(entityId: number) {
  invariant(hasTint(entityId), `Entity ${entityId} has no Tint`);
  return DATA[entityId];
}

export function getTintOrDefault(entityId: number, defaultValue: number) {
  return hasTint(entityId) ? getTint(entityId) : defaultValue;
}

export function removeTint(entityId: number) {
  delete DATA[entityId];
}
