import assert from "node:assert";
import test, { Mock } from "node:test";
import { RenderSystem } from "./RenderSystem";
import { SpriteComponent2 } from "../components";
import { MockState } from "../testHelpers";

test("it renders the scene", () => {
  const system = new RenderSystem();
  const state = new MockState() as any;
  system.start(state);
  system.update(state);
  assert(
    (state.renderer.render as unknown as Mock<any>).mock.calls.length === 1
  );
  system.stop();
});

test("when sprites are added it adds them to the scene", async () => {
  const system = new RenderSystem();

  const state = new MockState();

  const spriteEntity = {};
  SpriteComponent2.add(spriteEntity);
  state.addQueryResult([SpriteComponent2], spriteEntity);
  // state.queryEntities.push(sprite);

  assert.equal(state.scene.size, 0);

  system.start(state as any);

  system.update(state as any);
  assert.equal(state.scene.size, 1);
  system.update(state as any);
  assert.equal(state.scene.size, 1);

  assert(state.scene.has(spriteEntity.sprite));
  system.stop();
});
