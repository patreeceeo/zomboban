import { ComponentBase } from "../Component";

// TODO handle removed entities

export function deserializeEntityData(
  entityId: number,
  components: ComponentBase<any>[],
  json: string,
): void {
  const data = JSON.parse(json) as Record<string, unknown>;

  for (const component of components) {
    if (component.serialType in data) {
      const value = data[component.serialType];
      component.deserialize(entityId, value);
    } else {
      console.warn(`No data for ${component.humanName}`);
    }
  }
}

export function serializeEntityData(
  entityId: number,
  components: ComponentBase<any>[],
  target: Record<string, unknown> = {},
): string {
  for (const component of components) {
    if (component.has(entityId)) {
      target[component.serialType] = component.serialize(entityId);
    }
  }

  return JSON.stringify(target);
}

export function serializeAllEntityComponentData(
  entities: Enumerable<number>,
  components: ComponentBase<any>[],
  SoA: Record<string, unknown[]> = {},
): string {
  for (const component of components) {
    const name = component.serialType;
    const array = (SoA[name] = [] as unknown[]);
    for (const entityId of entities) {
      if (component.has(entityId)) {
        array[entityId] = component.serialize(entityId);
      }
    }
  }

  return JSON.stringify(SoA);
}

export function deserializeAllEntityComponentData(
  components: ComponentBase<any>[],
  json: string,
  setEntity: (id: number) => void,
): void {
  const SoA = JSON.parse(json) as Record<string, unknown[]>;
  for (const component of components) {
    const name = component.serialType;
    const array = SoA[name];
    if (!array) {
      console.warn(`No data to deserialize for ${name}`);
      continue;
    }
    for (const [entityId, value] of array.entries()) {
      setEntity(entityId);
      if (value !== null) {
        component.deserialize(entityId, value);
      }
    }
  }
}
