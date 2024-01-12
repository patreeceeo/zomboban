import { peekNextEntityId, setNextEntityId, registerEntity } from "./Entity";
import { invariant } from "./Error";
import type { ActLike, Behavior } from "./components/ActLike";
import { COMPONENT_DATA_URL } from "./constants";
import { inflateString } from "./util";

export const enum ComponentName {
  ActLike = "ActLike",
  Image = "Image",
  IsVisible = "IsVisible",
  Layer = "Layer",
  LoadingState = "LoadingState",
  LookLike = "LookLike",
  PixiApp = "PixiApp",
  PixiAppId = "PixiAppId",
  PositionX = "PositionX",
  PositionY = "PositionY",
  ShouldSave = "ShouldSave",
  Sprite = "Sprite",
  EntityFrameOperation = "ToBeRemoved",
  VelocityX = "VelocityX",
  VelocityY = "VelocityY",
  CameraFollow = "CameraFollow",
  SpriteSheet = "SpriteSheet",
  Animation = "Animation",
  Tint = "Tint",
  Text = "Text",
}

const COMPONENT_DATA: Record<ComponentName, unknown[]> = {
  [ComponentName.ActLike]: [],
  [ComponentName.Image]: [],
  [ComponentName.IsVisible]: [],
  [ComponentName.Layer]: [],
  [ComponentName.LoadingState]: [],
  [ComponentName.LookLike]: [],
  [ComponentName.PixiApp]: [],
  [ComponentName.PixiAppId]: [],
  [ComponentName.PositionX]: [],
  [ComponentName.PositionY]: [],
  [ComponentName.ShouldSave]: [],
  [ComponentName.Sprite]: [],
  [ComponentName.EntityFrameOperation]: [],
  [ComponentName.VelocityX]: [],
  [ComponentName.VelocityY]: [],
  [ComponentName.CameraFollow]: [],
  [ComponentName.SpriteSheet]: [],
  [ComponentName.Animation]: [],
  [ComponentName.Tint]: [],
  [ComponentName.Text]: [],
};

export function initComponentData(
  name: ComponentName,
  data = COMPONENT_DATA[name],
) {
  COMPONENT_DATA[name] = data;
  return data;
}

export function getComponentData() {
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
  if (peekNextEntityId() < nextEntityId + sourceData.length) {
    setNextEntityId(nextEntityId + sourceData.length);
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

async function getBehaviorMap(): Promise<
  Partial<Record<ActLike, new (entityId: number) => Behavior>>
> {
  const {
    WallBehavior,
    BroBehavior,
    PlayerBehavior,
    BoxBehavior,
    CursorBehavior,
  } = await import("./behaviors");
  const { ActLike } = await import("./components/ActLike");
  return {
    [ActLike.WALL]: WallBehavior,
    [ActLike.BRO]: BroBehavior,
    [ActLike.PLAYER]: PlayerBehavior,
    [ActLike.BOX]: BoxBehavior,
    [ActLike.CURSOR]: CursorBehavior,
  };
}

const deserializeActLike: ComponentDeserializer<ActLike, Behavior> = async (
  data: ActLike[],
  startIndex = 0,
): Promise<Behavior[]> => {
  const BEHAVIOR_MAP = await getBehaviorMap();
  return data.map((value, entityId) => {
    if (value) {
      const Constructor = BEHAVIOR_MAP[value as ActLike];
      invariant(!!Constructor, `Cannot deserialize behavior ${value}`);
      return new Constructor!(entityId + startIndex);
    }
  }) as Behavior[];
};

interface ComponentSerializer<I = unknown, O = unknown> {
  (data: I[]): O[];
}

interface ComponentDeserializer<I = unknown, O = unknown> {
  (data: I[], startIndex?: number): Promise<O[]>;
}

const COMPONENT_SERIALIZERS: Partial<
  Record<ComponentName, ComponentSerializer<any>>
> = {
  [ComponentName.ActLike]: (data: (Behavior | undefined)[]) =>
    data.map((behavior) => {
      if (behavior) {
        return behavior.type;
      }
    }),
  [ComponentName.LookLike]: serializeEntityIdComponent,
  [ComponentName.PixiAppId]: serializeEntityIdComponent,
};

const COMPONENT_DESERIALIZERS: Partial<
  Record<ComponentName, ComponentDeserializer<any>>
> = {
  [ComponentName.ActLike]: deserializeActLike,
  [ComponentName.LookLike]: deserializeEntityIdComponent,
  [ComponentName.PixiAppId]: deserializeEntityIdComponent,
};

const defaultComponentDeserializer: ComponentDeserializer = (data) =>
  Promise.resolve(data);

function serializeEntityIdComponent(data: readonly number[]): number[] {
  return data.map((entityId) => entityId);
}
function deserializeEntityIdComponent(
  data: readonly number[],
): Promise<number[]> {
  return Promise.resolve(data.map((entityId) => entityId));
}

export function serializeComponentData(
  componentData: Record<ComponentName, unknown[]>,
): string {
  return JSON.stringify(componentData, (key, value) => {
    if (key in COMPONENT_SERIALIZERS) {
      const serializer = COMPONENT_SERIALIZERS[key as ComponentName]!;
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
    const deserializer =
      COMPONENT_DESERIALIZERS[name as ComponentName] ??
      defaultComponentDeserializer;
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
  const nextEntityId = peekNextEntityId();
  const response = await fetch(COMPONENT_DATA_URL);
  if (response.status === 200) {
    const buffer = await response.arrayBuffer();
    await deserializeComponentData(
      inflateString(new Uint8Array(buffer)),
      nextEntityId,
    );
    // TODO maybe this should be in the behavior system?
    const behaviors = COMPONENT_DATA[ComponentName.ActLike].filter(
      (b) => !!b,
    ) as Behavior[];
    for (const behavior of behaviors) {
      behavior.start();
    }
  }
}
