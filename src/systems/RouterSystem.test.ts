import assert from "node:assert";
import test, { beforeEach, describe } from "node:test";
import { createRouterSystem } from "../systems";
import { System, SystemManager } from "../System";
import { State } from "../state";
import { RouteId, RouteSystemRegistery } from "../Route";

class TestState extends State {
  isSignedIn = false;
}


class ActionSystem extends System<any> {}
class RenderSystem extends System<any> {}
class EditorSystem extends System<any> {}

function getRouterSystem(
  state: State,
  ...args: Parameters<typeof createRouterSystem>
) {
  const RouterSystem = createRouterSystem(...args);
  const mgr = new SystemManager(state);
  return new RouterSystem(mgr);
}

const defaultRoute = new RouteId("", "game");

const theDocument = {
  onclick: (_: MouseEvent) => {},
};

describe("RouterSystem", () => {
  let state: TestState;
  beforeEach(() => {
    state = new TestState();
    state.route.default = defaultRoute;
  });

  test("valid route", () => {
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("", "another");
    const router = getRouterSystem(state, reg, theDocument);

    reg
      .register(defaultRoute, [ActionSystem, RenderSystem])
      .register(anotherRoute, [EditorSystem, RenderSystem]);

    state.route.current = defaultRoute;
    router.start(state);
    state.route.current = anotherRoute;
    router.update(state);

    assert(state.route.current.equals(anotherRoute));
  });

  test("invalid route", () => {
    const reg = new RouteSystemRegistery();
    const router = getRouterSystem(state, reg, theDocument);

    reg.register(defaultRoute, [ActionSystem, RenderSystem]);

    state.route.current = defaultRoute;
    router.start(state)
    // oops, typo!
    state.route.current = new RouteId("", "gaem");
    router.update(state);
    assert(state.route.current.equals(defaultRoute));
  });

  test("not allowed", () => { 
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("/editor", "another");
    const router = getRouterSystem(state, reg, theDocument);

    reg
      .register(defaultRoute)
      .registerWithGuard(anotherRoute, [], (state) => {
        return state.isSignedIn;
      });
    state.isSignedIn = false;
    state.route.current = defaultRoute;
    router.start(state);
    state.route.current = anotherRoute;
    router.update(state);

    assert(state.route.current.equals(defaultRoute));
  });

  test("redirect to default if current not allowed", () => {
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("", "another");
    const router = getRouterSystem(state, reg, theDocument);

    reg
      .register(defaultRoute)
      .registerWithGuard(anotherRoute, [], (state) => {
        return state.isSignedIn;
      });
    state.isSignedIn = false;
    state.route.current = anotherRoute;
    router.start(state);
    router.update(state);

    assert(state.route.current.equals(defaultRoute));
  });

  test("systems added and removed", () => {
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("", "another");
    const router = getRouterSystem(state, reg, theDocument);
    const { Systems } = router.mgr;

    reg
      .register(defaultRoute, [ActionSystem, RenderSystem])
      .register(anotherRoute, [EditorSystem, RenderSystem]);

    state.route.current = defaultRoute;
    router.start(state);
    router.update(state);
    assert(Systems.has(ActionSystem));
    assert(Systems.has(RenderSystem));
    assert(!Systems.has(EditorSystem));

    state.route.current = anotherRoute;
    router.update(state);
    assert(!Systems.has(ActionSystem));
    assert(Systems.has(RenderSystem));
    assert(Systems.has(EditorSystem));

    state.route.current = defaultRoute;
    router.update(state);
    assert(Systems.has(ActionSystem));
    assert(Systems.has(RenderSystem));
    assert(!Systems.has(EditorSystem));
  });
});
