import assert from "node:assert";
import test, { Mock } from "node:test";
import { RenderSystem } from "./RenderSystem";
import { AddedTag, TransformComponent } from "../components";
import { MockState } from "../testHelpers";
import { IObservableSet } from "../Observable";
import { SystemManager } from "../System";
import { World } from "../EntityManager";

test.afterEach(() => {
  TransformComponent.clear();
  (TransformComponent.entities as IObservableSet<any>).unobserve();
});

test("it renders the scene", () => {
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new RenderSystem(mgr);
  const world = new World();

  const entity = world.addEntity();

  TransformComponent.add(entity);
  AddedTag.add(entity);

  system.start(state);
  system.update(state);
  assert(
    (state.composer.render as unknown as Mock<any>).mock.calls.length === 1
  );
  system.stop(state);
});

test("when sprites are added it adds them to the scene and renders", () => {
  const state = new MockState() as any;
  const mgr = new SystemManager(state);
  const system = new RenderSystem(mgr);
  const world = new World();

  const spriteEntity = world.addEntity();
  TransformComponent.add(spriteEntity);
  AddedTag.add(spriteEntity);

  assert.equal(state.scene.children.length, 0);

  system.start(state as any);
  system.update(state as any);

  assert(state.scene.children.includes(spriteEntity.transform));
  system.stop(state);
});

test("when sprites are removed it removes them from the scene and renders", () => {
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new RenderSystem(mgr);
  const world = new World();

  const spriteEntity = world.addEntity();
  TransformComponent.add(spriteEntity);
  AddedTag.add(spriteEntity);

  system.start(state as any);
  system.update(state as any);

  TransformComponent.remove(spriteEntity);
  assert(!state.scene.children.includes(spriteEntity.transform));
  system.stop(state);
});

test("it renders when entities are changing", () => {
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new RenderSystem(mgr);
  const world = new World();

  const entity = world.addEntity();
  TransformComponent.add(entity);
  AddedTag.add(entity);

  system.start(state);
  system.update(state);

  assert(
    (state.composer.render as unknown as Mock<any>).mock.calls.length === 1
  );

  // No render
  system.update(state);

  state.shouldRerender = true;
  system.update(state);

  assert(
    (state.composer.render as unknown as Mock<any>).mock.calls.length === 2
  );
  system.stop(state);
});
