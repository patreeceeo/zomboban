import assert from "node:assert";
import test from "node:test";
import { RenderSystem } from "./RenderSystem";
import { CameraComponent, InSceneTag, TransformComponent } from "../components";
import { getMock, MockState } from "../testHelpers";
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
  assert.equal(
    getMock(state.composer.render).calls.length, 1
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

test("when an active camera entity is added, it sets up the camera", () => {
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new RenderSystem(mgr);
  const world = new World();
  const cameraEntity = world.addEntity();
  const previousComposer = state.composer;

  test.mock.method(system, "setUpActiveCamera")
  CameraComponent.add(cameraEntity);
  InSceneTag.add(cameraEntity);

  system.start(state as any);

  assert.equal(getMock(system.setUpActiveCamera).calls.length, 1);
  assert.equal(getMock(previousComposer.dispose).calls.length, 1);
  assert.notEqual(state.composer, previousComposer);
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
