import assert from "node:assert";
import test from "node:test";
import { createRouterSystem } from "./RouterSystem";
import { System, SystemManager } from "../System";
import { MockState, getMock } from "../testHelpers";
import { location } from "../globals";
import { composeMixins } from "../Mixins";
import { RouterMixin, RouterState } from "../state";
import { SystemEnum, SystemRegistery } from ".";

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

test("default route", () => {
  const state = new State();
  const { registeredSystems } = state;
  const { ActionSystem, RenderSystem } = registerTestSystems(registeredSystems);
  const router = getRouterSystem(
    state,
    {
      game: new Set([SystemEnum.Action, SystemEnum.Render])
    },
    "game"
  );

  // oops, typo!
  state.currentRoute = "gaem";
  router.update(state);
  assert(router.mgr.Systems.has(ActionSystem));
  assert(router.mgr.Systems.has(RenderSystem));
});

test("initial route", () => {
  const state = new State();
  const { registeredSystems } = state;
  const { ActionSystem, RenderSystem } = registerTestSystems(registeredSystems);
  const router = getRouterSystem(
    state,
    {
      game: new Set([SystemEnum.Action, SystemEnum.Render])
    },
    "game"
  );

  state.currentRoute = "game";
  router.update(state);

  assert(router.mgr.Systems.has(ActionSystem));
  assert(router.mgr.Systems.has(RenderSystem));
});

test("route change", () => {
  const state = new State();
  const { registeredSystems } = state;
  const { ActionSystem, RenderSystem, EditorSystem } =
    registerTestSystems(registeredSystems);

  RenderSystem.prototype.stop = test.mock.fn();
  const router = getRouterSystem(
    state,
    {
      game: new Set([SystemEnum.Action, SystemEnum.Render]),
      editor: new Set([SystemEnum.Editor, SystemEnum.Render])
    },
    "game"
  );
  state.currentRoute = "game";
  router.update(state);

  state.currentRoute = "editor";
  router.update(state);

  assert(router.mgr.Systems.has(EditorSystem));
  assert(router.mgr.Systems.has(RenderSystem));
  assert(!router.mgr.Systems.has(ActionSystem));
  assert.equal(getMock(RenderSystem.prototype.stop).callCount(), 0);
});

test("changing route after defaulting", () => {
  const state = new State();
  const { registeredSystems } = state;
  const { RenderSystem } = registerTestSystems(registeredSystems);

  RenderSystem.prototype.stop = test.mock.fn();

  const RouterSystem = createRouterSystem(
    {
      game: new Set([SystemEnum.Action, SystemEnum.Render]),
      editor: new Set([SystemEnum.Editor, SystemEnum.Render])
    },
    "game"
  );
  const mgr = new SystemManager(new MockState());
  const router = new RouterSystem(mgr);
  // route will resolve to default
  state.currentRoute = "geam";
  router.update(state);

  state.currentRoute = "editor";
  router.update(state);

  assert.equal(getMock(RenderSystem.prototype.stop).callCount(), 0);
});

test("changing back to default route", () => {
  const state = new State();
  const { registeredSystems } = state;
  const { ActionSystem, RenderSystem } = registerTestSystems(registeredSystems);
  const router = getRouterSystem(
    state,
    {
      game: new Set([SystemEnum.Action, SystemEnum.Render]),
      another: new Set([])
    },
    "game"
  );

  state.currentRoute = "another";
  router.update(state);
  location.href = "http://example.com";
  router.services[0].update(state);
  router.update(state);
  assert(router.mgr.Systems.has(ActionSystem));
  assert(router.mgr.Systems.has(RenderSystem));
});
