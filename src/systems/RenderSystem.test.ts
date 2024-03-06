import assert from "node:assert";
import test, { Mock } from "node:test";
import { RenderSystem } from "./RenderSystem";
import { SpriteComponent2 } from "../components";
import { MockState } from "../testHelpers";

const system = new RenderSystem();

test.afterEach(() => {
  system.stop();
  SpriteComponent2.clear();
});

test("it renders the scene", () => {
  const state = new MockState() as any;
  system.start(state);
  system.update(state);
  assert(
    (state.renderer.render as unknown as Mock<any>).mock.calls.length === 1
  );
  system.stop();
});

test("when sprites are added it adds them to the scene", () => {
  const state = new MockState();

  const spriteEntity = {};
  SpriteComponent2.add(spriteEntity);
  state.addQueryResult([SpriteComponent2], spriteEntity);

  assert.equal(state.scene.children.length, 0);

  system.start(state as any);

  system.update(state as any);
  assert.equal(state.scene.children.length, 1);
  system.update(state as any);
  assert.equal(state.scene.children.length, 1);

  assert(state.scene.children.includes(spriteEntity.sprite));
});

test("when sprites are removed it removes them from the scene", () => {
  const state = new MockState();

  const spriteEntity = {};
  SpriteComponent2.add(spriteEntity);
  state.addQueryResult([SpriteComponent2], spriteEntity);

  system.start(state as any);
  system.update(state as any);
  assert.equal(state.scene.children.length, 1);

  state.removeQueryResult([SpriteComponent2], spriteEntity);
  assert.equal(state.scene.children.length, 0);
});
