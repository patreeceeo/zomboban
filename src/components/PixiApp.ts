import type { Application } from "pixi.js";
import { invariant } from "../Error";

const DATA: Array<Application> = [];

export function setPixiApp(entityId: number, app: Application) {
  DATA[entityId] = app;
}

export function hasPixiApp(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getPixiApp(entityId: number): Application {
  invariant(hasPixiApp(entityId), `Entity ${entityId} does not have a PixiApp`);
  return DATA[entityId];
}
