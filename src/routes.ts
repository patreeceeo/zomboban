import { SystemEnum } from "./systems";
import { RouteId, RouteSystemRegistery } from "./Route";

const BASIC_SYSTEMS = [
  SystemEnum.Tile,
  SystemEnum.Behavior,
  SystemEnum.Action,
  SystemEnum.Model,
  SystemEnum.Animation,
  SystemEnum.Camera,
  SystemEnum.Render,
  SystemEnum.Client,
  SystemEnum.Input
];

// Client-side routes
export const gameRoute = new RouteId("", "game");
export const editorRoute = new RouteId("", "editor");
export const menuRoute = new RouteId("", "menu");
export const helpRoute = new RouteId("", "help");
export const storyRoute = new RouteId("", "story");

export const ROUTES = new RouteSystemRegistery();
ROUTES.register(gameRoute, [...BASIC_SYSTEMS, SystemEnum.Game])
  .register(menuRoute, [...BASIC_SYSTEMS, SystemEnum.Editor])
  .register(menuRoute)
  .register(helpRoute)
  .register(storyRoute);

export const apiRoute = RouteId.root.nest("api");
export const entitiesApiRoute = apiRoute.nest("entity");
export const entityApiRoute = entitiesApiRoute.nest(":id");
