import assert from "node:assert";
import test, { Mock } from "node:test";
import { RenderSystem } from "./RenderSystem";
import { InSceneTag, TransformComponent } from "../components";
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
  InSceneTag.add(entity);

  system.start(state);
  system.update(state);
  assert(
    (state.composer.render as unknown as Mock<any>).mock.calls.length === 1
  );
  system.stop(state);
});

test("when sprites are added it adds them to the scene", () => {
  const state = new MockState() as any;
  const mgr = new SystemManager(state);
  const system = new RenderSystem(mgr);
  const world = new World();

  const spriteEntity = world.addEntity();
  TransformComponent.add(spriteEntity);
  InSceneTag.add(spriteEntity);

  system.start(state as any);

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
  InSceneTag.add(spriteEntity);

  system.start(state as any);

  TransformComponent.remove(spriteEntity);
  assert(!state.scene.children.includes(spriteEntity.transform));
  system.stop(state);
});

test("when the system stops it removes all models from the scene", () => {
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new RenderSystem(mgr);
  const world = new World();

  const spriteEntity = world.addEntity();
  TransformComponent.add(spriteEntity);
  InSceneTag.add(spriteEntity);

  system.start(state as any);
  assert(state.scene.children.includes(spriteEntity.transform));

  system.stop(state as any);

  assert(!state.scene.children.includes(spriteEntity.transform));
});
