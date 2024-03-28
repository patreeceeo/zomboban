import { ActionSystem } from "./systems/ActionSystem";
import { AnimationSystem } from "./systems/AnimationSystem";
import { BehaviorSystem } from "./systems/BehaviorSystem";
import { CameraSystem } from "./systems/CameraSystem";
import { ClientSystem } from "./systems/ClientSystem";
import { EditorSystem } from "./systems/EditorSystem";
import { GameSystem } from "./systems/GameSystem";
import { InputSystem } from "./systems/InputSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { IRouteRecord } from "./systems/RouterSystem";
import { TileSystem } from "./systems/TileSystem";

export const ROUTES: IRouteRecord = {
  game: new Set([
    AnimationSystem,
    TileSystem,
    BehaviorSystem,
    ActionSystem,
    CameraSystem,
    RenderSystem,
    GameSystem,
    ClientSystem,
    InputSystem
  ]),
  editor: new Set([
    AnimationSystem,
    TileSystem,
    TileSystem,
    BehaviorSystem,
    ActionSystem,
    CameraSystem,
    RenderSystem,
    EditorSystem,
    ClientSystem,
    InputSystem
  ])
};

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = "game";
