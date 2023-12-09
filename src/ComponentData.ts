import { peekNextEntityId, setNextEntityId, registerEntity } from "./Entity";

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
  ToBeRemoved = "ToBeRemoved",
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
  [ComponentName.ToBeRemoved]: [],
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
