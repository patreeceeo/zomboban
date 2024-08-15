import { SystemEnum } from ".";
import { invariant } from "../Error";
import { RouteId, RouteSystemRegistery } from "../Route";
import { System } from "../System";
import { location } from "../globals";
import { RouterState } from "../state";

type Context = RouterState;

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

export function createRouterSystem(routes: RouteSystemRegistery) {
  return class RouterSystem extends System<Context> {
    #previousRoute = RouteId.root;
    syncCurrentRouteWithLocation(state: Context) {
      if (!state.currentRoute.test(location)) {
        const route = RouteId.fromLocation();

        state.currentRoute = route;
      }
    }
    start(state: Context) {
      this.syncCurrentRouteWithLocation(state);
      this.updateSystems(state);
      this.#previousRoute = state.currentRoute;

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
    updateSystems(state: Context) {
      const { mgr } = this;
      const { registeredSystems } = state;
      if (!routes.has(state.currentRoute)) {
        const newRoute = (state.currentRoute = state.defaultRoute);
        newRoute.follow();
      }
      const currentRouteSystems = routes.getSystems(state.currentRoute);
      const previousRouteSystems = routes.getSystems(this.#previousRoute);

      // stop systems that are from the previous route and not in the current route
      for (const id of previousRouteSystems) {
        if (!currentRouteSystems.has(id)) {
          const ctor = registeredSystems.get(id);
          invariant(ctor !== undefined, `Missing system ${SystemEnum[id]}`);
          mgr.remove(ctor);
        }
      }

      // start systems that are in the current route and not from the previous route
      // TODO test that it inserts in the correct order!
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
    }
    update(state: Context) {
      if (!this.#previousRoute.equals(state.currentRoute)) {
        this.updateSystems(state);
      }
      this.#previousRoute = state.currentRoute;
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
