import { ActionSystem } from "./systems/ActionSystem";
import { AnimationSystem } from "./systems/AnimationSystem";
import { BehaviorSystem } from "./systems/BehaviorSystem";
import { CameraSystem } from "./systems/CameraSystem";
import { ClientSystem } from "./systems/ClientSystem";
import { EditorSystem } from "./systems/EditorSystem";
import { GameSystem } from "./systems/GameSystem";
import { InputSystem } from "./systems/InputSystem";
import { ModelSystem } from "./systems/ModelSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { IRouteRecord } from "./systems/RouterSystem";
import { TileSystem } from "./systems/TileSystem";
import { ViewportSystem } from "./systems/ViewportSystem";

export const ROUTES: IRouteRecord = {
  game: new Set([
    TileSystem,
    BehaviorSystem,
    ActionSystem,
    ModelSystem,
    AnimationSystem,
    CameraSystem,
    ViewportSystem,
    RenderSystem,
    GameSystem,
    ClientSystem,
    InputSystem
  ]),
  editor: new Set([
    TileSystem,
    TileSystem,
    BehaviorSystem,
    ActionSystem,
    ModelSystem,
    AnimationSystem,
    CameraSystem,
    ViewportSystem,
    RenderSystem,
    EditorSystem,
    ClientSystem,
    InputSystem
  ])
};

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = "game";
