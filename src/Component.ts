import { Counter } from "./Counter";
import { registerEntity } from "./Entity";
import { invariant } from "./Error";
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
type ComponentMap<T> = Record<ComponentName, T>;
export type ComponentData = ComponentMap<unknown[]>;

const COMPONENT_DATA: ComponentData = {};

const HAS_COMPONENT: ComponentMap<HasFunction> = {};
const GET_COMPONENT: ComponentMap<GetFunction<any>> = {};
const ADD_SET_COMPONENT: ComponentMap<AddSetFunction<any>> = {};
const REMOVE_COMPONENT: ComponentMap<RemoveFunction> = {};

const SERIALIZERS: Record<ComponentName, ComponentSerializer<any>> = {};

const DESERIALIZERS: Record<
  ComponentName,
  ComponentDeserializer<any> | undefined
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
  HAS_COMPONENT[name] = has;
  GET_COMPONENT[name] = get;
  ADD_SET_COMPONENT[name] = addSet;
  REMOVE_COMPONENT[name] = remove;
  SERIALIZERS[name] = serialize;
  DESERIALIZERS[name] = deserialize;
  return data;
}

export function getComponentData(): Readonly<ComponentData> {
  return COMPONENT_DATA;
}

export function findMaxEntityId(data: ComponentData) {
  return Object.values(data).reduce(
    (max, componentData) => Math.max(max, componentData.length),
    0,
  );
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
  const selectedComponentData: ComponentData = {};
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

export function serializeComponentData(componentData: ComponentData): string {
  return JSON.stringify(componentData, (key, value) => {
    if (key in SERIALIZERS) {
      const serializer = SERIALIZERS[key as ComponentName]!;
      return serializer(value);
    } else {
      return value;
    }
  });
}

async function applyDeserializer<I, O>(
  name: ComponentName,
  data: Maybe<I>[],
  nextEntityId: number,
): Promise<Maybe<O>[]> {
  const deserializer = DESERIALIZERS[name]!;
  invariant(
    deserializer !== undefined,
    `No deserializer for ${name} component. Has its defining module been imported?`,
  );
  return (await deserializer(data, nextEntityId)) as Maybe<O>[];
}

let COMPONENT_RAW_DATA_CACHE: ArrayBuffer;

async function fetchComponentRawData(
  url: string,
): Promise<ArrayBuffer | undefined> {
  if (!COMPONENT_RAW_DATA_CACHE) {
    const response = await fetch(url);
    if (response.status === 200) {
      COMPONENT_RAW_DATA_CACHE = await response.arrayBuffer();
    } else {
      console.error("Failed to fetch component data");
    }
  }
  return COMPONENT_RAW_DATA_CACHE!;
}

export const loadComponentsCursor = new Counter();

let hasLoadingStarted = false;

export async function loadComponents(url: string, forceReload = false) {
  const nextEntityId = loadComponentsCursor.value;
  if (forceReload || !hasLoadingStarted) {
    hasLoadingStarted = true;
    const rawData = await fetchComponentRawData(url);
    if (!rawData) {
      return;
    }
    const componentData = JSON.parse(
      inflateString(new Uint8Array(rawData)),
    ) as ComponentData;

    for (const [name, value] of Object.entries(componentData)) {
      const deserializedValue = await applyDeserializer(
        name as ComponentName,
        value,
        nextEntityId,
      );
      appendComponentData(
        deserializedValue,
        COMPONENT_DATA[name as ComponentName],
        nextEntityId,
      );
    }
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
