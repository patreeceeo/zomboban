import { SystemEnum } from "./systems";
import { RouteId, RouteSystemRegistery } from "./Route";

const BASIC_SYSTEMS = [
  SystemEnum.Loading,
  SystemEnum.SceneManager,
  SystemEnum.Tile,
  SystemEnum.Behavior,
  SystemEnum.Action,
  SystemEnum.Model,
  SystemEnum.Animation,
  SystemEnum.Camera,
  SystemEnum.Render,
  SystemEnum.Input
];

// Client-side routes
export const gameRoute = RouteId.root.withHash("game");
export const editorRoute = RouteId.root.withHash("editor");
export const menuRoute = RouteId.root.withHash("menu");
export const helpRoute = RouteId.root.withHash("help");

export const ROUTES = new RouteSystemRegistery();
ROUTES.register(gameRoute, [...BASIC_SYSTEMS, SystemEnum.Game])
  .registerWithGuard(editorRoute, [...BASIC_SYSTEMS, SystemEnum.Editor], (state) => state.isSignedIn)
  .register(menuRoute, [SystemEnum.Loading])
  .register(helpRoute, [SystemEnum.Loading])

export const apiRoute = RouteId.root.nest("api");
export const entitiesApiRoute = apiRoute.nest("entity");
export const entityApiRoute = entitiesApiRoute.nest(":id");
