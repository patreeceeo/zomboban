import { ISystemConstructor, System } from "../System";
import { GlobalInputEntity } from "../entities/GlobalInputEntity";
import { URLSearchParams, location } from "../globals";
import { BehaviorCacheState, EntityManagerState, RouterState } from "../state";

type Context = RouterState & EntityManagerState & BehaviorCacheState;

export type IRouteRecord = Record<string, Set<ISystemConstructor<any>>>;

export function parseRouteFromLocation(): string | undefined {
  const { hash } = location;
  if (hash.length > 0 && hash !== "#") {
    return hash.slice(1);
  }
}

export function parseRouteParamsFromLocation(
  target = {} as Record<string, string>
) {
  const query = new URLSearchParams(location.search);
  for (const [key, value] of query) {
    target[key] = value;
  }
  return target;
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
  routeId: string,
  query?: Record<string, string | number>
) {
  location.href = `${location.protocol}//${location.host}${location.pathname}${
    query ? "?" + stringifyQuery(query) : ""
  }#${routeId}`;
}

function isInternalLink(a: HTMLAnchorElement) {
  return a.origin === location.host && a.pathname === location.pathname;
}

export function createRouterSystem<Routes extends IRouteRecord>(
  routes: Routes,
  defaultRoute: keyof Routes
) {
  return class RouterSystem extends System<Context> {
    #previousRoute: string | undefined;
    #input: ReturnType<typeof GlobalInputEntity.create> | undefined;
    start(state: Context) {
      if (this.#input === undefined) {
        this.#input = GlobalInputEntity.create(state);
      }

      document.onclick = (e) => {
        if (e.target instanceof HTMLAnchorElement && isInternalLink(e.target)) {
          e.preventDefault();
          const href = e.target.href;
          if (href) {
            location.href = href;
            routeTo(parseRouteFromLocation() ?? (defaultRoute as string));
          }
        }
      };
    }
    update(state: Context) {
      if (this.#previousRoute !== state.currentRoute) {
        const currentRouteSystems =
          routes[state.currentRoute] ?? routes[defaultRoute];
        if (this.#previousRoute) {
          const previousRouteSystems =
            routes[this.#previousRoute] ?? routes[defaultRoute];

          // stop systems that are from the previous route and not in the current route
          for (const System of previousRouteSystems) {
            if (!currentRouteSystems.has(System)) {
              this.mgr.remove(System);
            }
          }

          // start systems that are in the current route and not from the previous route
          for (const System of currentRouteSystems) {
            if (!previousRouteSystems.has(System)) {
              this.mgr.push(System);
            }
          }
        } else {
          for (const System of currentRouteSystems) {
            this.mgr.push(System);
          }
        }
        this.#previousRoute = state.currentRoute;
      }
    }
    stop(state: Context) {
      if (this.#input !== undefined) {
        GlobalInputEntity.destroy(this.#input);
        state.removeEntity(this.#input);
      }
    }

    services = [
      {
        update: (state: Context) => {
          const route = parseRouteFromLocation();
          if (route) {
            state.currentRoute = route;
          }
        }
      }
    ];
  };
}
