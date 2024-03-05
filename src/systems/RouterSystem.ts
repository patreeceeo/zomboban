import { ISystemConstructor, System } from "../System";
import { URLSearchParams, location } from "../globals";
import { State } from "../state";

export type IRouteRecord = Record<string, Set<ISystemConstructor<State>>>;

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
  location.href = `${location.protocol}//${location.host}${
    query ? "?" + stringifyQuery(query) : ""
  }#${routeId}`;
}

export function createRouterSystem<Routes extends IRouteRecord>(
  routes: Routes,
  defaultRoute: keyof Routes
) {
  return class RouterSystem extends System<State> {
    #previousRoute: string | undefined;
    update(state: State) {
      if (this.#previousRoute !== state.currentRoute) {
        const currentRouteSystems =
          routes[state.currentRoute] ?? routes[defaultRoute];
        if (this.#previousRoute) {
          const previousRouteSystems =
            routes[this.#previousRoute] ?? routes[defaultRoute];

          // stop systems that are from the previous route and not in the current route
          for (const System of previousRouteSystems) {
            if (!currentRouteSystems.has(System)) {
              this.mgr.remove(System, state);
            }
          }

          // start systems that are in the current route and not from the previous route
          for (const System of currentRouteSystems) {
            if (!previousRouteSystems.has(System)) {
              this.mgr.push(System, state);
            }
          }
        } else {
          for (const System of currentRouteSystems) {
            this.mgr.push(System, state);
          }
        }
        this.#previousRoute = state.currentRoute;
      }
    }

    services = [
      {
        update: (state: State) => {
          const route = parseRouteFromLocation();
          if (route) {
            state.currentRoute = route;
          }
        }
      }
    ];
  };
}
