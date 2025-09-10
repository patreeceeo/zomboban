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

export function createRouterSystem(routes: RouteSystemRegistery<any>, theDocument: Pick<Document, "onclick">) {
  return class RouterSystem extends System<State> {
    #previousRoute = RouteId.root;

    sync(state: State) {
      if (!state.route.current.test(location) && routes.allows(state, state.route.current)) {
        location.href = state.route.current.toHref();
        this.updateSystems(state);
        this.#previousRoute = state.route.current;
      } else {
        state.route.current = RouteId.fromLocation(location);
      }
    }
    start(state: State) {
      this.sync(state);

      theDocument.onclick = (e) => {
        const anchorEl = findParentAnchor(e.target as HTMLElement);
        if (anchorEl !== null && isInternalLink(anchorEl)) {
          e.preventDefault();
          const newRoute = RouteId.fromLocation(anchorEl);
          state.route.current = newRoute;
        }
      };
    }
    updateSystems(state: State) {
      const { mgr } = this;
      const currentRouteSystems = routes.getSystems(state.route.current);
      const previousRouteSystems = routes.getSystems(this.#previousRoute);

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
