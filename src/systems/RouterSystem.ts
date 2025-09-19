import {invariant} from "../Error";
import { RouteId, RouteSystemRegistery } from "../Route";
import { System } from "../System";
import { location } from "../globals";
import { State } from "../state";

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

const emptySet = new Set();

export function createRouterSystem(routes: RouteSystemRegistery<any>, theDocument: Pick<Document, "onclick">) {
  return class RouterSystem extends System<State> {
    #previousRoute = null as RouteId | null;

    sync(state: State) {
      if(!routes.allows(state, state.route.current)) {
        const fromLocation = RouteId.fromLocation(location);
        if(routes.allows(state, fromLocation)) {
          state.route.current = fromLocation;
        } else {
          invariant(routes.allows(state, state.route.default), "Default route must be unconditionally allowed");
          state.route.current = state.route.default;
        }
      }
      if(this.#previousRoute === null || !state.route.current.equals(this.#previousRoute)) {
        location.href = state.route.current.toHref();
        this.updateSystems(state);
      }
      this.#previousRoute = state.route.current;
    }
    start(state: State) {
      this.updateSystems(state);
      this.sync(state);

      theDocument.onclick = (e) => {
        const anchorEl = findParentAnchor(e.target as HTMLElement);
        if (anchorEl !== null && isInternalLink(anchorEl)) {
          e.preventDefault();
          const newRoute = RouteId.fromLocation(anchorEl);
          state.route.current = newRoute;
        }
      };

      window.addEventListener('popstate', () => {
        const newRoute = RouteId.fromLocation(location);
        if (routes.allows(state, newRoute)) {
          state.route.current = newRoute;
        }
      });
    }
    updateSystems(state: State) {
      const { mgr } = this;
      const currentRouteSystems = routes.getSystems(state.route.current);
      const previousRouteSystems = this.#previousRoute !== null ? routes.getSystems(this.#previousRoute) : emptySet as Set<any>;

      // stop systems that are from the previous route and not in the current route
      for (const SystemConstructor of previousRouteSystems) {
        if (!currentRouteSystems.has(SystemConstructor)) {
          mgr.remove(SystemConstructor);
        }
      }

      // start systems that are in the current route and not from the previous route
      // TODO test that it inserts in the correct order!
      // start at 1 becasue router system is always first.
      let index = 1;
      for (const SystemConstructor of currentRouteSystems) {
        if (!previousRouteSystems.has(SystemConstructor)) {
          mgr.insert(SystemConstructor, index);
        } else {
          mgr.reorder(SystemConstructor, index);
        }
        index++;
      }
    }
    update(state: State) {
      this.sync(state);
    }

  };
}
