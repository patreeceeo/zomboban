import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";
import { hasPixiApp } from "./PixiApp";

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
