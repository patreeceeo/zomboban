import { AnimatedTextureLoaderSystem } from "./systems/AnimatedTextureLoaderSystem";
import { CameraSystem } from "./systems/CameraSystem";
import { EditorSystem } from "./systems/EditorSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { IRouteRecord } from "./systems/RouterSystem";

export const ROUTES: IRouteRecord = {
  game: new Set([AnimatedTextureLoaderSystem, CameraSystem, RenderSystem]),
  editor: new Set([
    AnimatedTextureLoaderSystem,
    CameraSystem,
    RenderSystem,
    EditorSystem
  ])
};

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = "game";
