import { ComponentName, initComponentData } from "../ComponentData";

const NAME = ComponentName.ShouldSave;
const DATA = initComponentData(NAME) as boolean[];

export function setShouldSave(entityId: number, value: boolean) {
  DATA[entityId] = value;
}

export function shouldSave(entityId: number): boolean {
  return !!DATA[entityId];
}
