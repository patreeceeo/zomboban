import { Counter } from "./Counter";
import { hasEntity, registerEntity } from "./Entity";
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
type ComponentRecord<T> = Record<ComponentName, T>;
export type ComponentData = ComponentRecord<unknown[]>;

const COMPONENT_DATA: ComponentData = {};

const HAS_COMPONENT: Partial<ComponentRecord<HasFunction>> = {};
const GET_COMPONENT: Partial<ComponentRecord<GetFunction<any>>> = {};
const ADD_SET_COMPONENT: Partial<ComponentRecord<AddSetFunction<any>>> = {};
const REMOVE_COMPONENT: Partial<ComponentRecord<RemoveFunction>> = {};

const SERIALIZERS: Partial<ComponentRecord<ComponentSerializer<any>>> = {};

const DESERIALIZERS: Partial<
  Record<ComponentName, ComponentDeserializer<any> | undefined>
> = {};

export function defineComponent<T>(
  name: ComponentName,
  data: T[],
  has: HasFunction,
  get: GetFunction<T>,
  addSet: AddSetFunction<T>,
  remove: RemoveFunction,
  serialize = defaultComponentSerializer,
  deserialize = defaultComponentDeserializer
): T[] {
  COMPONENT_DATA[name] = data;
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

export function appendComponentData<T>(
  sourceData: T[],
  targetData: T[],
  options = defaultLoadComponentsOptions
) {
  for (
    let i = 0, entityId = options.nextEntityId;
    i < sourceData.length;
    i++, entityId++
  ) {
    // TODO I wanna be able to say "if (has(sourceData, i)) {...}"
    if (sourceData[i] !== null && sourceData[i] !== undefined) {
      console.log("appending", entityId, sourceData[i]);
      targetData[entityId] = sourceData[i];
    }
    registerEntity(entityId);
  }
}

export function selectComponentData(
  selectedComponents: readonly ComponentName[],
  selectedEntities: readonly number[]
): Partial<ComponentData> {
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
  componentData: Partial<ComponentData>,
  indent = 0
): string {
  return JSON.stringify(
    componentData,
    (key, value) => {
      if (key in SERIALIZERS) {
        const serializer = SERIALIZERS[key as ComponentName]!;
        return serializer(value);
      }
      return value;
      // } else if (key === "") {
      //   return value;
      // } else if (value) {
      //   return typeof value === "object" ? value.constructor.name : value;
      // }
    },
    indent
  );
}

async function applyDeserializer<I, O>(
  name: ComponentName,
  data: Maybe<I>[],
  nextEntityId: number
): Promise<Maybe<O>[]> {
  const deserializer = DESERIALIZERS[name]!;
  invariant(
    deserializer !== undefined,
    `No deserializer for ${name} component. Has its defining module been imported?`
  );
  return (await deserializer(data, nextEntityId)) as Maybe<O>[];
}

// let COMPONENT_DATA_CACHE: ComponentData | undefined;

async function fetchComponentData(
  url: string
): Promise<Record<ComponentName, unknown[]> | undefined> {
  // if (!COMPONENT_DATA_CACHE) {
  const response = await fetch(url);
  if (response.status === 200) {
    return await response.json();
  } else {
    console.error("Failed to fetch component data", response);
  }
  // }
  // return COMPONENT_DATA_CACHE!;
}

export const loadComponentsCursor = new Counter();

// let hasLoadingStarted = false;

export interface LoadComponentsOptions {
  handleExistingEntity(entityId: number): void;
  nextEntityId: number;
}

const defaultLoadComponentsOptions: LoadComponentsOptions = {
  handleExistingEntity: (_) => {},
  nextEntityId: 0,
};

export async function loadComponents(
  url: string,
  options = defaultLoadComponentsOptions
) {
  // const nextEntityId = loadComponentsCursor.value;
  // if (forceReload || !hasLoadingStarted) {
  // hasLoadingStarted = true;
  try {
    console.log("Loading component data from", url);
    const data = await fetchComponentData(url);
    if (data) {
      await deserializeComponentData(data, options);
    }
  } catch (e) {
    console.error(e);
  }
  // }
}

export async function saveComponents(
  url: string,
  data: Partial<ComponentData> = COMPONENT_DATA
) {
  const serializedData = serializeComponentData(data);
  console.log("saving", serializedData);
  // const body = deflateString(serializedData);
  // console.log("byteLength", body.byteLength);
  // const body = JSON.stringify(serializedData);
  console.log({ url });
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: serializedData,
  });
}

export async function deserializeComponentData(
  // data: ArrayBuffer,
  data: Record<ComponentName, unknown[]>,
  options = defaultLoadComponentsOptions
): Promise<void> {
  // const record = JSON.parse(
  //   inflateString(new Uint8Array(data))
  // ) as Record<ComponentName, unknown[]>;
  // const record = JSON.parse(data) as Record<ComponentName, unknown[]>;

  // console.log("Deserializing component data", data, Object.entries(data));
  console.log("nextEntityId", options.nextEntityId);
  const maxEntityId =
    Math.max(...Object.values(data).map((d) => d.length)) +
    options.nextEntityId -
    1;

  for (
    let entityId = options.nextEntityId;
    entityId < maxEntityId;
    entityId++
  ) {
    if (hasEntity(entityId)) {
      options.handleExistingEntity(entityId);
    }
  }

  for (const [name, value] of Object.entries(data)) {
    const deserializedValue = await applyDeserializer(
      name as ComponentName,
      value,
      options.nextEntityId
    );
    appendComponentData(
      deserializedValue,
      COMPONENT_DATA[name as ComponentName],
      options
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
    HAS_COMPONENT[name as ComponentName]!(entityId)
  );
}

export function getEntityComponentData(
  entityId: number
): Record<ComponentName, any> {
  const result: Record<ComponentName, any> = {};
  for (const name in COMPONENT_DATA) {
    if (HAS_COMPONENT[name as ComponentName]?.(entityId)) {
      result[name] = GET_COMPONENT[name as ComponentName]!(entityId);
    }
  }
  return result;
}
