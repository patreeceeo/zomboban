import { SystemEnum } from ".";
import { invariant } from "../Error";
import { Route } from "../Route";
import { System } from "../System";
import { location } from "../globals";
import { RouterState } from "../state";

type Context = RouterState;

export type IRouteRecord = Record<string, Set<SystemEnum>>;

function findParentAnchor(el: HTMLElement | null) {
  let current = el as HTMLElement | null;
  while (current !== null) {
    if (current instanceof HTMLAnchorElement) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function isInternalLink(a: HTMLAnchorElement) {
  return a.host === location.host && a.pathname === location.pathname;
}

export function createRouterSystem<Routes extends IRouteRecord>(
  routes: Routes
) {
  return class RouterSystem extends System<Context> {
    #previousRoute: string | undefined;
    syncCurrentRouteWithLocation(state: Context) {
      const route = Route.fromLocation();

      state.currentRoute = route.path;
    }
    start(state: Context) {
      this.syncCurrentRouteWithLocation(state);

      document.onclick = (e) => {
        const anchorEl = findParentAnchor(e.target as HTMLElement);
        if (anchorEl !== null && isInternalLink(anchorEl)) {
          e.preventDefault();
          const href = anchorEl.href;
          if (href) {
            location.href = href;
            this.syncCurrentRouteWithLocation(state);
          }
        }
      };
    }
    update(state: Context) {
      const { mgr } = this;
      const { registeredSystems } = state;
      if (this.#previousRoute !== state.currentRoute) {
        if (!(state.currentRoute in routes)) {
          state.currentRoute = Route.default.path;
        }
        const currentRouteSystems = routes[state.currentRoute];

        if (this.#previousRoute) {
          const previousRouteSystems =
            routes[this.#previousRoute] ?? Route.default;

          // stop systems that are from the previous route and not in the current route
          for (const id of previousRouteSystems) {
            if (!currentRouteSystems.has(id)) {
              const ctor = registeredSystems.get(id);
              invariant(ctor !== undefined, `Missing system ${SystemEnum[id]}`);
              mgr.remove(ctor);
            }
          }

          // start systems that are in the current route and not from the previous route
          // TODO test that it inserts then in the correct order!
          // start at 1 becasue router system is always first.
          let index = 1;
          for (const id of currentRouteSystems) {
            const ctor = registeredSystems.get(id);
            invariant(ctor !== undefined, `Missing system ${SystemEnum[id]}`);
            if (!previousRouteSystems.has(id)) {
              mgr.insert(ctor, index);
            } else {
              mgr.reorder(ctor, index);
            }
            index++;
          }
        } else {
          for (const id of currentRouteSystems) {
            const ctor = registeredSystems.get(id);
            invariant(ctor !== undefined, `Missing system ${SystemEnum[id]}`);
            mgr.push(ctor);
          }
        }
        this.#previousRoute = state.currentRoute;
      }
    }

    services = [
      {
        update: (state: Context) => {
          this.syncCurrentRouteWithLocation(state);
        }
      }
    ];
  };
}
