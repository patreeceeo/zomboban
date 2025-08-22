import assert from "node:assert";
import test, { beforeEach, describe } from "node:test";
import { createRouterSystem } from "./RouterSystem";
import { System, SystemManager } from "../System";
import { MockState, getMock } from "../testHelpers";
import { location } from "../globals";
import { State } from "../state";
import { SystemEnum, SystemRegistery } from ".";
import { RouteId, RouteSystemRegistery } from "../Route";

class TestState extends State {
  isSignedIn = false;
}


function registerTestSystems(reg: SystemRegistery) {
  class ActionSystem extends System<any> {}
  class RenderSystem extends System<any> {}
  class EditorSystem extends System<any> {}
  reg.set(SystemEnum.Action, ActionSystem);
  reg.set(SystemEnum.Render, RenderSystem);
  reg.set(SystemEnum.Editor, EditorSystem);
  return { ActionSystem, RenderSystem, EditorSystem };
}

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
  let state = new TestState();
  beforeEach(() => {
    state.route.default = defaultRoute;
    state.route.current = defaultRoute;
    defaultRoute.follow(location);
  });

  test("default route", () => {
    const { registeredSystems } = state;
    const { ActionSystem, RenderSystem } =
      registerTestSystems(registeredSystems);
    const reg = new RouteSystemRegistery();
    const router = getRouterSystem(state, reg, theDocument);

    reg.register(defaultRoute, [SystemEnum.Action, SystemEnum.Render]);
    // oops, typo!
    state.route.current = new RouteId("", "gaem");
    router.update(state);
    assert(state.route.current === defaultRoute);
    assert(router.mgr.Systems.has(ActionSystem));
    assert(router.mgr.Systems.has(RenderSystem));
    assert(state.route.current.test(location));
  });

  test("initial route", () => {
    const { registeredSystems } = state;
    const { ActionSystem, RenderSystem } =
      registerTestSystems(registeredSystems);
    const reg = new RouteSystemRegistery();
    const router = getRouterSystem(state, reg, theDocument);

    reg.register(defaultRoute, [SystemEnum.Action, SystemEnum.Render]);
    state.route.current = defaultRoute;
    router.update(state);

    assert(router.mgr.Systems.has(ActionSystem));
    assert(router.mgr.Systems.has(RenderSystem));
  });

  test("route change", () => {
    const { registeredSystems } = state;
    const { ActionSystem, RenderSystem, EditorSystem } =
      registerTestSystems(registeredSystems);
    const reg = new RouteSystemRegistery();
    const editorRoute = new RouteId("", "editor");

    reg
      .register(defaultRoute, [SystemEnum.Action, SystemEnum.Render])
      .register(editorRoute, [SystemEnum.Editor, SystemEnum.Render]);

    RenderSystem.prototype.stop = test.mock.fn();

    const router = getRouterSystem(state, reg, theDocument);
    state.route.current = defaultRoute;
    router.update(state);

    state.route.current = editorRoute;
    router.update(state);

    assert(router.mgr.Systems.has(EditorSystem));
    assert(router.mgr.Systems.has(RenderSystem));
    assert(!router.mgr.Systems.has(ActionSystem));
    assert.equal(getMock(RenderSystem.prototype.stop).callCount(), 0);
  });

  test("changing route after defaulting", () => {
    const { registeredSystems } = state;
    const { RenderSystem } = registerTestSystems(registeredSystems);
    const reg = new RouteSystemRegistery();
    const editorRoute = new RouteId("", "editor");

    reg
      .register(defaultRoute, [SystemEnum.Action, SystemEnum.Render])
      .register(editorRoute, [SystemEnum.Editor, SystemEnum.Render]);

    RenderSystem.prototype.stop = test.mock.fn();

    const RouterSystem = createRouterSystem(reg, theDocument);
    const mgr = new SystemManager(new MockState());
    const router = new RouterSystem(mgr);
    // route will resolve to default
    state.route.current = new RouteId("", "geam");
    router.update(state);
    assert.equal(state.route.current, defaultRoute);

    state.route.current = editorRoute;
    router.update(state);

    assert.equal(getMock(RenderSystem.prototype.stop).callCount(), 0);
  });

  test("changing back to default route", () => {
    const { registeredSystems } = state;
    const { ActionSystem, RenderSystem } =
      registerTestSystems(registeredSystems);
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("", "another");

    const router = getRouterSystem(state, reg, theDocument);

    reg
      .register(defaultRoute, [SystemEnum.Action, SystemEnum.Render])
      .register(anotherRoute);

    state.route.current = new RouteId("", "another");
    router.update(state);
    location.href = "http://example.com";
    router.syncCurrentRouteWithLocation(state)
    router.update(state);
    router.syncCurrentRouteWithLocation(state)
    router.update(state);
    assert(router.mgr.Systems.has(ActionSystem));
    assert(router.mgr.Systems.has(RenderSystem));
  });

  test("route guard", () => {
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("/editor", "another");

    const router = getRouterSystem(state, reg, theDocument);

    state.isSignedIn = false;
    reg
      .register(defaultRoute)
      .registerWithGuard(anotherRoute, [], (state) => {
        return state.isSignedIn;
      });

    router.start(state);
    state.route.current = anotherRoute;
    router.update(state);
    assert(state.route.current === defaultRoute);
  });
});
