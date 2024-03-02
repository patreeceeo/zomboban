import { CameraSystem } from "./systems/CameraSystem";
import { GameSystem } from "./systems/GameSystem";
import { IRouteRecord } from "./systems/RouterSystem";

export const ROUTES: IRouteRecord = {
  game: new Set([CameraSystem, GameSystem])
};

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = "game";
