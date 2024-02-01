import { reserveEntities } from "./entities";
import { ANIMATIONS, IMAGES } from "./constants";
import { batchQueueImageLoading } from "./functions/ImageLoading";
import { batchQueueAnimationLoading } from "./functions/AnimationLoading";
import { SCENE_MANAGER, SceneId } from "./scenes";
import { invariant } from "./Error";

if (import.meta.hot) {
  import.meta.hot.accept("./constants", () => {});
}

export enum RouteId {
  NOT_FOUND = "not-found",
  MAIN_MENU = "main-menu",
  EDITOR = "editor",
  GAME = "game",
}

const ROUTES: Record<RouteId, () => void> = {
  [RouteId.NOT_FOUND]: () => {
    console.error("Route not found");
  },
  [RouteId.MAIN_MENU]: () => {
    SCENE_MANAGER.start(SceneId.MENU);
  },
  [RouteId.EDITOR]: () => {
    SCENE_MANAGER.start(SceneId.EDITOR);
  },
  [RouteId.GAME]: () => {
    SCENE_MANAGER.start(SceneId.GAME);
  },
};

const DEFAULT_ROUTE = RouteId.MAIN_MENU;

function parseLoction(): RouteId {
  const { hash } = window.location;
  if (hash.length === 0 || hash === "#") {
    return DEFAULT_ROUTE;
  } else if (hash) {
    const routeId = hash.slice(1) as RouteId;
    if (routeId in ROUTES) {
      return routeId;
    }
  }
  return RouteId.NOT_FOUND;
}

export function startLoading() {
  reserveEntities();

  batchQueueImageLoading(IMAGES);

  batchQueueAnimationLoading(ANIMATIONS);
}

export function route() {
  const routeId = parseLoction();
  const routeFn = ROUTES[routeId];
  invariant(!!routeFn, `Route not found: ${routeId}`);
  routeFn();
}

export function routeTo(routeId: RouteId) {
  window.location.hash = routeId;
}
