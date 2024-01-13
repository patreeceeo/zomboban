import { ComponentName, initComponentData } from "../Component";
import { invariant } from "../Error";

const NAME = ComponentName.ShouldSave;
const DATA = initComponentData(
  NAME,
  [],
  hasShouldSave,
  getShouldSave,
  setShouldSave,
  removeShouldSave,
);

export function hasShouldSave(entityId: number): boolean {
  return !!DATA[entityId];
}

export function getShouldSave(entityId: number): boolean {
  invariant(
    DATA[entityId] !== undefined,
    `Entity ${entityId} does not have a ShouldSave`,
  );
  return DATA[entityId];
}

export function setShouldSave(entityId: number, value: boolean) {
  DATA[entityId] = value;
}

export function shouldSave(entityId: number): boolean {
  return !!DATA[entityId];
}

export function removeShouldSave(entityId: number) {
  delete DATA[entityId];
}
