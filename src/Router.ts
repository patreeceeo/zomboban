import { ReservedEntity, reserveEntities } from "./entities";
import { setPixiApp } from "./components/PixiApp";
import {
  ANIMATIONS,
  HAND_CURSOR_STYLE,
  HAND_TAP_CURSOR_STYLE,
  IMAGES,
} from "./constants";
import { batchQueueImageLoading } from "./functions/ImageLoading";
import { batchQueueAnimationLoading } from "./functions/AnimationLoading";
import { SCENE_MANAGER, SceneId } from "./scenes";
import { invariant } from "./Error";
import { SCREENX_PX, SCREENY_PX } from "./units/convert";
import { Application } from "pixi.js";

if (import.meta.hot) {
  import.meta.hot.accept("./constants", () => {});
}

export enum RouteId {
  NOT_FOUND = "not-found",
  MAIN_MENU = "main-menu",
  EDITOR = "editor",
  GAME = "game",
  GAME_OVER = "game-over",
}

const ROUTES: Record<RouteId, () => void> = {
  [RouteId.NOT_FOUND]: () => {
    console.error("Route not found");
  },
  [RouteId.MAIN_MENU]: () => {
    SCENE_MANAGER.start(SceneId.MAIN_MENU);
  },
  [RouteId.EDITOR]: () => {
    SCENE_MANAGER.start(SceneId.EDITOR);
  },
  [RouteId.GAME]: () => {
    SCENE_MANAGER.start(SceneId.GAME);
  },
  [RouteId.GAME_OVER]: () => {
    SCENE_MANAGER.start(SceneId.GAME_OVER);
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

export async function mountRouter(element: HTMLElement) {
  const app = mountPixiApp(element);

  setPixiApp(ReservedEntity.DEFAULT_PIXI_APP, app);
}

export function mountPixiApp(parent: HTMLElement): Application {
  const app = new Application({
    width: SCREENX_PX,
    height: SCREENY_PX,
  });

  parent.appendChild(app.view as any);
  const { cursorStyles } = app.renderer.events;
  cursorStyles.default = HAND_CURSOR_STYLE;
  cursorStyles.pointer = HAND_CURSOR_STYLE;
  cursorStyles.tap = HAND_TAP_CURSOR_STYLE;

  addEventListener("mousedown", () => {
    app.renderer.events.setCursor("tap");
  });
  addEventListener("keydown", () => {
    app.renderer.events.setCursor("none");
  });
  return app;
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
