import assert from "node:assert";
import test, { Mock } from "node:test";
import { Renderer, Texture } from "three";
import { RenderSystem } from "./RenderSystem";
import { SpriteComponent2 } from "../components";

class MockRenderer implements Renderer {
  render = test.mock.fn();
  setSize(): void {
    return;
  }
  domElement: HTMLCanvasElement = null as unknown as HTMLCanvasElement;
}

test("it renders the scene", () => {
  const system = new RenderSystem();
  const state = {
    renderer: new MockRenderer(),
    scene: null,
    camera: null,
    getTexture: () => null
  } as any;
  system.start(state);
  system.update(state);
  assert(
    (state.renderer.render as unknown as Mock<any>).mock.calls.length === 1
  );
  system.stop();
});

test("when sprites are added it adds them to the scene", () => {
  const system = new RenderSystem();
  const mockTexture = new Texture();
  const scene = new Set();

  const state = {
    renderer: new MockRenderer(),
    scene,
    camera: null,
    getTexture: () => mockTexture
  } as any;
  system.start(state);

  assert.equal(scene.size, 0);

  const sprite = {};
  SpriteComponent2.add(sprite);
  if (SpriteComponent2.has(sprite)) {
    system.update(state);
    assert.equal(scene.size, 1);
    system.update(state);
    assert.equal(scene.size, 1);

    assert(scene.has(sprite.sprite));
  } else {
    throw new Error("entity was not added to SpriteComponent");
  }
  system.stop();
});
