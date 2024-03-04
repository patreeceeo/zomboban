import { CameraSystem } from "./systems/CameraSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { IRouteRecord } from "./systems/RouterSystem";

export const ROUTES: IRouteRecord = {
  game: new Set([CameraSystem, RenderSystem])
};

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = "game";
