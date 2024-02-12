import { SCENE_MANAGER, SceneId } from "./scenes";
import { invariant } from "./Error";
import { state } from "./state";

export enum RouteId {
  NOT_FOUND = "not-found",
  MAIN_MENU = "main-menu",
  EDITOR = "editor",
  GAME = "game",
}

const ROUTES: Record<RouteId, (query: URLSearchParams) => void> = {
  [RouteId.NOT_FOUND]: () => {
    console.error("Route not found");
  },
  [RouteId.MAIN_MENU]: () => {
    SCENE_MANAGER.start(SceneId.MENU);
  },
  [RouteId.EDITOR]: (query) => {
    if (query.has("world")) {
      const worldId = parseInt(query.get("world")!);
      state.loadWorld(worldId);
    }
    SCENE_MANAGER.start(SceneId.EDITOR);
  },
  [RouteId.GAME]: (query) => {
    if (query.has("world")) {
      const worldId = parseInt(query.get("world")!);
      state.loadWorld(worldId);
    }
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

export function handleRouteChange() {
  const routeId = parseLoction();
  const query = new URLSearchParams(window.location.search);
  const routeFn = ROUTES[routeId];
  invariant(!!routeFn, `Route not found: ${routeId}`);
  routeFn(query);
}

const _sp = new URLSearchParams();
function stringifyQuery(query: Record<string, string | number>) {
  for (const key in _sp) {
    _sp.delete(key);
  }
  for (const [key, value] of Object.entries(query)) {
    _sp.set(key, value.toString());
  }
  return _sp.toString();
}

export function routeTo(
  routeId: RouteId,
  query?: Record<string, string | number>,
) {
  // window.location.hash = routeId;
  // window.location.search = query ? stringifyQuery(query) : "";
  window.location.href = `${
    query ? "?" + stringifyQuery(query) : ""
  }#${routeId}`;
}
