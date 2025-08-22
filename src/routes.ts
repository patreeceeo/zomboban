import { RouteId, RouteSystemRegistery } from "./Route";
import {
  LoadingSystem,
  SceneManagerSystem,
  TileSystem,
  BehaviorSystem,
  ActionSystem,
  ModelSystem,
  AnimationSystem,
  RenderSystem,
  InputSystem,
  GameSystem,
  EditorSystem
} from "./systems";

const BASIC_SYSTEMS = [
  LoadingSystem,
  SceneManagerSystem,
  TileSystem,
  BehaviorSystem,
  ActionSystem,
  ModelSystem,
  AnimationSystem,
  RenderSystem,
  InputSystem
];

// Client-side routes
export const gameRoute = RouteId.root.withHash("game");
export const editorRoute = RouteId.root.withHash("editor");
export const menuRoute = RouteId.root.withHash("menu");
export const helpRoute = RouteId.root.withHash("help");

export const ROUTES = new RouteSystemRegistery();
ROUTES.register(gameRoute, [...BASIC_SYSTEMS, GameSystem])
  .registerWithGuard(editorRoute, [...BASIC_SYSTEMS, EditorSystem], (state) => state.isSignedIn)
  .register(menuRoute, [LoadingSystem])
  .register(helpRoute, [LoadingSystem])

export const apiRoute = RouteId.root.nest("api");
export const entitiesApiRoute = apiRoute.nest("entity");
export const entityApiRoute = entitiesApiRoute.nest(":id");
