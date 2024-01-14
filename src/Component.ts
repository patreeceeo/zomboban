import { getNextEntityId, registerEntity } from "./Entity";
import { COMPONENT_DATA_URL } from "./constants";
import { inflateString } from "./util";

interface HasFunction {
  (entityId: number): boolean;
}
interface GetFunction<T> {
  (entityId: number): T;
}
interface AddSetFunction<T> {
  (entityId: number, value: T): void;
}
interface RemoveFunction {
  (entityId: number): void;
}

type Maybe<T> = T | undefined;
export interface ComponentSerializer<I = unknown, O = unknown> {
  (data: Maybe<I>[]): Maybe<O>[];
}

export interface ComponentDeserializer<I = unknown, O = unknown> {
  (data: Maybe<I>[], startIndex?: number): Promise<Maybe<O>[]>;
}

if (import.meta.hot) {
  import.meta.hot.accept("./constants", () => {});
}

type ComponentName = string;

const COMPONENT_DATA: Record<ComponentName, unknown[]> = {};

const HAS_COMPONENT: Partial<Record<ComponentName, HasFunction>> = {};
const GET_COMPONENT: Partial<Record<ComponentName, GetFunction<any>>> = {};
const ADD_SET_COMPONENT: Partial<Record<ComponentName, AddSetFunction<any>>> =
  {};
const REMOVE_COMPONENT: Partial<Record<ComponentName, RemoveFunction>> = {};

const SERIALIZERS: Partial<Record<ComponentName, ComponentSerializer<any>>> =
  {};

const DESERIALIZERS: Partial<
  Record<ComponentName, ComponentDeserializer<any>>
> = {};

export function defineComponent<T>(
  name: ComponentName,
  data: T[],
  has: HasFunction,
  get: GetFunction<T>,
  addSet: AddSetFunction<T>,
  remove: RemoveFunction,
  serialize = defaultComponentSerializer,
  deserialize = defaultComponentDeserializer,
): T[] {
  COMPONENT_DATA[name] = data;
  COMPONENT_DATA[name] = data;
  HAS_COMPONENT[name] = has;
  GET_COMPONENT[name] = get;
  ADD_SET_COMPONENT[name] = addSet;
  REMOVE_COMPONENT[name] = remove;
  SERIALIZERS[name] = serialize;
  DESERIALIZERS[name] = deserialize;
  return (COMPONENT_DATA[name] || []) as T[];
}

export function getComponentData(): Readonly<Record<ComponentName, unknown[]>> {
  return COMPONENT_DATA;
}

export function appendComponentData<T>(
  sourceData: T[],
  targetData: T[],
  nextEntityId: number,
) {
  for (
    let i = 0, entityId = nextEntityId;
    i < sourceData.length;
    i++, entityId++
  ) {
    targetData[entityId] = sourceData[i];
    registerEntity(entityId);
  }
}

export function selectComponentData(
  selectedComponents: readonly ComponentName[],
  selectedEntities: readonly number[],
) {
  const componentData = getComponentData();
  const selectedComponentData: Record<string, unknown[]> = {};
  for (const componentName of selectedComponents) {
    selectedComponentData[componentName] = [];
    for (const entityId of selectedEntities) {
      selectedComponentData[componentName][entityId] =
        componentData[componentName][entityId];
    }
  }
  return selectedComponentData;
}

const defaultComponentSerializer: ComponentSerializer<any, any> = (data) =>
  data;

const defaultComponentDeserializer: ComponentDeserializer<any, any> = (data) =>
  Promise.resolve(data);

export function serializeComponentData(
  componentData: Record<ComponentName, unknown[]>,
): string {
  return JSON.stringify(componentData, (key, value) => {
    if (key in SERIALIZERS) {
      const serializer = SERIALIZERS[key as ComponentName]!;
      return serializer(value);
    } else {
      return value;
    }
  });
}

async function deserializeComponentData(
  data: string,
  nextEntityId: number,
): Promise<void> {
  const parsed = JSON.parse(data);
  for (const [name, value] of Object.entries(parsed)) {
    const deserializer = DESERIALIZERS[name as ComponentName]!;
    const deserializedValue = await deserializer(
      value as unknown[],
      nextEntityId,
    );
    appendComponentData(
      deserializedValue,
      COMPONENT_DATA[name as ComponentName],
      nextEntityId,
    );
  }
}

export async function loadComponents() {
  const nextEntityId = getNextEntityId();
  const response = await fetch(COMPONENT_DATA_URL);
  if (response.status === 200) {
    const buffer = await response.arrayBuffer();
    await deserializeComponentData(
      inflateString(new Uint8Array(buffer)),
      nextEntityId,
    );
  }
}

export function removeComponentData(entityId: number) {
  for (const name in COMPONENT_DATA) {
    if (HAS_COMPONENT[name as ComponentName]?.(entityId)) {
      REMOVE_COMPONENT[name as ComponentName]!(entityId);
    }
  }
}

export function hasComponentData(entityId: number) {
  return Object.keys(COMPONENT_DATA).some((name) =>
    HAS_COMPONENT[name as ComponentName]!(entityId),
  );
}

export function getEntityComponentData(
  entityId: number,
): Record<ComponentName, any> {
  const result: Record<ComponentName, any> = {};
  for (const name in COMPONENT_DATA) {
    if (HAS_COMPONENT[name as ComponentName]?.(entityId)) {
      result[name] = GET_COMPONENT[name as ComponentName]!(entityId);
    }
  }
  return result;
}
