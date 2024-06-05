import { ActionSystem } from "./systems/ActionSystem";
import { AnimationSystem } from "./systems/AnimationSystem";
import { BehaviorSystem } from "./systems/BehaviorSystem";
import { CameraSystem } from "./systems/CameraSystem";
import { ClientSystem } from "./systems/ClientSystem";
import { LogSystem } from "./systems/LogSystem";
import { EditorSystem } from "./systems/EditorSystem";
import { GameSystem } from "./systems/GameSystem";
import { InputSystem } from "./systems/InputSystem";
import { ModelSystem } from "./systems/ModelSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { IRouteRecord } from "./systems/RouterSystem";
import { TileSystem } from "./systems/TileSystem";
import { ActionDebugSystem } from "./systems/ActionDebugSystem";

const BASIC_SYSTEMS = [
  TileSystem,
  BehaviorSystem,
  ActionSystem,
  ModelSystem,
  AnimationSystem,
  CameraSystem,
  RenderSystem,
  ClientSystem,
  InputSystem,
  LogSystem,
  ActionDebugSystem
];

export const ROUTES: IRouteRecord = {
  game: new Set([...BASIC_SYSTEMS, GameSystem]),
  editor: new Set([...BASIC_SYSTEMS, EditorSystem]),
  about: new Set([RenderSystem, InputSystem])
};

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = "game";
