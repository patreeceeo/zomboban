import assert from "node:assert";
import test, { beforeEach, describe } from "node:test";
import { createRouterSystem } from "./RouterSystem";
import { System, SystemManager } from "../System";
import { MockState, getMock } from "../testHelpers";
import { location } from "../globals";
import { composeMixins } from "../Mixins";
import { RouterMixin, RouterState } from "../state";
import { SystemEnum, SystemRegistery } from ".";
import { RouteId, RouteSystemRegistery } from "../Route";

const State = composeMixins(RouterMixin);

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
  state: RouterState,
  ...args: Parameters<typeof createRouterSystem>
) {
  const RouterSystem = createRouterSystem(...args);
  const mgr = new SystemManager(state);
  return new RouterSystem(mgr);
}

const defaultRoute = new RouteId("", "game");

describe("RouterSystem", () => {
  let state = new State();
  beforeEach(() => {
    state.defaultRoute = defaultRoute;
    state.currentRoute = defaultRoute;
    defaultRoute.follow(location);
  });

  test("default route", () => {
    const { registeredSystems } = state;
    const { ActionSystem, RenderSystem } =
      registerTestSystems(registeredSystems);
    const reg = new RouteSystemRegistery();
    const router = getRouterSystem(state, reg);

    reg.register(defaultRoute, [SystemEnum.Action, SystemEnum.Render]);
    // oops, typo!
    state.currentRoute = new RouteId("", "gaem");
    router.update(state);
    assert(state.currentRoute === defaultRoute);
    assert(router.mgr.Systems.has(ActionSystem));
    assert(router.mgr.Systems.has(RenderSystem));
    assert(state.currentRoute.test(location));
  });

  test("initial route", () => {
    const { registeredSystems } = state;
    const { ActionSystem, RenderSystem } =
      registerTestSystems(registeredSystems);
    const reg = new RouteSystemRegistery();
    const router = getRouterSystem(state, reg);

    reg.register(defaultRoute, [SystemEnum.Action, SystemEnum.Render]);
    state.currentRoute = defaultRoute;
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

    const router = getRouterSystem(state, reg);
    state.currentRoute = defaultRoute;
    router.update(state);

    state.currentRoute = editorRoute;
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

    const RouterSystem = createRouterSystem(reg);
    const mgr = new SystemManager(new MockState());
    const router = new RouterSystem(mgr);
    // route will resolve to default
    state.currentRoute = new RouteId("", "geam");
    router.update(state);
    assert.equal(state.currentRoute, defaultRoute);

    state.currentRoute = editorRoute;
    router.update(state);

    assert.equal(getMock(RenderSystem.prototype.stop).callCount(), 0);
  });

  test("changing back to default route", () => {
    const { registeredSystems } = state;
    const { ActionSystem, RenderSystem } =
      registerTestSystems(registeredSystems);
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("", "another");

    const router = getRouterSystem(state, reg);

    reg
      .register(defaultRoute, [SystemEnum.Action, SystemEnum.Render])
      .register(anotherRoute);

    state.currentRoute = new RouteId("", "another");
    router.update(state);
    location.href = "http://example.com";
    router.services[0].update(state);
    router.update(state);
    assert(router.mgr.Systems.has(ActionSystem));
    assert(router.mgr.Systems.has(RenderSystem));
  });
});
