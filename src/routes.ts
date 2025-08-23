import { RouteId, RouteSystemRegistery } from "./Route";

export const ROUTES = new RouteSystemRegistery();

// Client-side routes
export const gameRoute = RouteId.root.withHash("game");
export const editorRoute = RouteId.root.withHash("editor");
export const menuRoute = RouteId.root.withHash("menu");
export const helpRoute = RouteId.root.withHash("help");

// API routes
export const apiRoute = RouteId.root.nest("api");
export const entitiesApiRoute = apiRoute.nest("entity");
export const entityApiRoute = entitiesApiRoute.nest(":id");
