import assert from "node:assert";
import test, { Mock } from "node:test";
import { RenderSystem } from "./RenderSystem";
import { AddedTag, SpriteComponent } from "../components";
import { MockState } from "../testHelpers";
import { IObservableSet } from "../Observable";
import { SystemManager } from "../System";

test.afterEach(() => {
  SpriteComponent.clear();
  (SpriteComponent.entities as IObservableSet<any>).unobserve();
});

test("it renders the scene", () => {
  const state = new MockState() as any;
  const mgr = new SystemManager(state);
  const system = new RenderSystem(mgr);
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

  const spriteEntity = {};
  SpriteComponent.add(spriteEntity);
  AddedTag.add(spriteEntity);

  assert.equal(state.scene.children.length, 0);

  system.start(state as any);
  system.update(state as any);

  assert(state.scene.children.includes(spriteEntity.sprite));
  system.stop(state);
});

test("when sprites are removed it removes them from the scene", () => {
  const state = new MockState() as any;
  const mgr = new SystemManager(state);
  const system = new RenderSystem(mgr);

  const spriteEntity = {};
  SpriteComponent.add(spriteEntity);
  AddedTag.add(spriteEntity);

  system.start(state as any);
  system.update(state as any);

  SpriteComponent.remove(spriteEntity);
  assert(!state.scene.children.includes(spriteEntity.sprite));
  system.stop(state);
});
