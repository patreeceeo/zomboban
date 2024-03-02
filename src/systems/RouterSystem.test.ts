import assert from "node:assert";
import test from "node:test";
import {
  createRouterSystem,
  parseRouteFromLocation,
  parseRouteParamsFromLocation
} from "./RouterSystem";
import { System } from "../System";
import { getMock } from "../testHelpers";
import { location } from "../globals";

function createTestSystems() {
  class ActorSystem extends System<any> {}
  class RenderSystem extends System<any> {}
  class EditorSystem extends System<any> {}
  return { ActorSystem, RenderSystem, EditorSystem };
}

test("default route", () => {
  const { ActorSystem, RenderSystem } = createTestSystems();
  const RouterSystem = createRouterSystem(
    {
      game: new Set([ActorSystem, RenderSystem])
    },
    "game"
  );
  const router = new RouterSystem();
  // oops, typo!
  router.update({ currentRoute: "gaem" } as any);
  assert(router.mgr.Systems.has(ActorSystem));
  assert(router.mgr.Systems.has(RenderSystem));
});

test("initial route", () => {
  const { ActorSystem, RenderSystem } = createTestSystems();
  const RouterSystem = createRouterSystem(
    {
      game: new Set([ActorSystem, RenderSystem])
    },
    "game"
  );
  const router = new RouterSystem();
  router.update({ currentRoute: "game" } as any);
  assert(router.mgr.Systems.has(ActorSystem));
  assert(router.mgr.Systems.has(RenderSystem));
});

test("route change", () => {
  const { ActorSystem, RenderSystem, EditorSystem } = createTestSystems();

  RenderSystem.prototype.stop = test.mock.fn();
  const RouterSystem = createRouterSystem(
    {
      game: new Set([ActorSystem, RenderSystem]),
      editor: new Set([EditorSystem, RenderSystem])
    },
    "game"
  );
  const router = new RouterSystem();
  router.update({ currentRoute: "game" } as any);

  router.update({ currentRoute: "editor" } as any);

  assert(router.mgr.Systems.has(EditorSystem));
  assert(router.mgr.Systems.has(RenderSystem));
  assert(!router.mgr.Systems.has(ActorSystem));
  assert.equal(getMock(RenderSystem.prototype.stop).callCount(), 0);
});

test("getting route from location", () => {
  assert.equal(parseRouteFromLocation(), undefined);
  location.hash = "#game";
  assert.equal(parseRouteFromLocation(), "game");
});

test("getting route params", () => {
  assert.deepEqual(parseRouteParamsFromLocation(), {});
  location.search = "?id=42&name=foo";
  assert.deepEqual(parseRouteParamsFromLocation(), { id: "42", name: "foo" });
});
