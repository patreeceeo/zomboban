import { ComponentBase } from "../Component";

// TODO handle removed entities

export function deserializeEntityData(
  entityId: number,
  components: Record<string, ComponentBase<any, any, any>>,
  json: string,
): void {
  const data = JSON.parse(json) as Record<string, unknown>;

  for (const key in data) {
    if (key in components) {
      const component = components[key];
      component.deserialize(entityId, data[key]);
    } else {
      console.warn(`No component to deserialize ${key}`);
    }
  }
}

export function serializeEntityData(
  entityId: number,
  components: Record<string, ComponentBase<any, any, any>>,
  target: Record<string, unknown> = {},
): string {
  for (const key in components) {
    const component = components[key];
    if (component.has(entityId)) {
      target[component.name] = component.serialize(entityId);
    } else {
      target[component.name] = null;
    }
  }

  return JSON.stringify(target);
}

export function serializeAllEntityComponentData(
  entities: Enumerable<number>,
  components: Record<string, ComponentBase<any, any, any>>,
  SoA: Record<string, unknown[]> = {},
): string {
  for (const name in components) {
    const component = components[name];
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
  components: Record<string, ComponentBase<any, any, any>>,
  json: string,
  setEntity: (id: number) => void,
): void {
  const SoA = JSON.parse(json) as Record<string, unknown[]>;

  for (const name in components) {
    const component = components[name];
    const array = SoA[name];
    for (const [entityId, value] of array.entries()) {
      setEntity(entityId);
      if (value !== null) {
        component.deserialize(entityId, value);
      }
    }
  }
}
