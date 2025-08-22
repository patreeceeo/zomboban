import assert from "node:assert";
import test from "node:test";
import { RenderSystem } from "./RenderSystem";
import { InSceneTag, TransformComponent } from "../components";
import { getMock, MockState } from "../testHelpers";
import { SystemManager } from "../System";
import { World } from "../EntityManager";
import {OrthographicCamera} from "three";


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
  const spriteEntity = state.addEntity();

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
  const camera = new OrthographicCamera();
  const previousComposer = state.composer;


  test.mock.method(system, "setUpActiveCamera")

  system.start(state as any);
  state.camera = camera;

  assert.equal(getMock(system.setUpActiveCamera).calls.length, 1);
  assert.equal(getMock(previousComposer.dispose).calls.length, 1);
  assert.notEqual(state.composer, previousComposer);
});

test("when the system stops it removes all models from the scene", () => {
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new RenderSystem(mgr);

  const spriteEntity = state.world.addEntity();
  TransformComponent.add(spriteEntity);
  InSceneTag.add(spriteEntity);

  system.start(state as any);
  assert(state.scene.children.includes(spriteEntity.transform));

  system.stop(state );

  assert(!state.scene.children.includes(spriteEntity.transform));
});

test("on update, sets camera target", () => {
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new RenderSystem(mgr);
  const activeCamera = new OrthographicCamera();

  system.start(state as any);
  state.camera = activeCamera;
  state.cameraTarget.set(100, 200, 300);
  system.update(state);
  system.stop(state)

  assert.equal(activeCamera.position.x, 100);
  assert.equal(activeCamera.position.y, 200);
  assert.equal(activeCamera.position.z, 300);
});
