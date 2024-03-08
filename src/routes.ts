import { AnimationSystem } from "./systems/AnimationSystem";
import { BehaviorSystem } from "./systems/BehaviorSystem";
import { CameraSystem } from "./systems/CameraSystem";
import { EditorSystem } from "./systems/EditorSystem";
import { InputSystem } from "./systems/InputSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { IRouteRecord } from "./systems/RouterSystem";

export const ROUTES: IRouteRecord = {
  game: new Set([
    InputSystem,
    AnimationSystem,
    BehaviorSystem,
    CameraSystem,
    RenderSystem
  ]),
  editor: new Set([
    InputSystem,
    AnimationSystem,
    BehaviorSystem,
    CameraSystem,
    RenderSystem,
    EditorSystem
  ])
};

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = "game";
