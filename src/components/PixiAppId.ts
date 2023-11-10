import { loadPartialComponent, savePartialComponent } from "../Component";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";
import { hasPixiApp } from "./PixiApp";

const STORAGE_KEY = "Component:PixiAppId";
const DATA: Array<number> = [];

export function setPixiAppId(entityId: number, appId: number) {
  invariant(hasPixiApp(appId), `PixiApp ${appId} does not exist`);
  if (appId !== DATA[entityId]) {
    setRenderStateDirty();
    DATA[entityId] = appId;
  }
}

export function hasPixiAppId(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getPixiAppId(entityId: number): number {
  invariant(
    hasPixiAppId(entityId),
    `Entity ${entityId} does not have a PixiAppId`,
  );
  return DATA[entityId];
}

export function savePixiAppId(selectedEntities: ReadonlyArray<number>) {
  savePartialComponent(STORAGE_KEY, DATA, selectedEntities);
}

export function loadPixiAppId(nextEntityId: number) {
  loadPartialComponent(STORAGE_KEY, DATA, nextEntityId);
}
