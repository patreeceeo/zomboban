import assert from "node:assert";
import test, { Mock } from "node:test";
import { Camera, Renderer, Scene, Texture, Sprite } from "three";
import { RenderSystem } from "./RenderSystem";
import { state } from "../newState";
import { SpriteComponent2 } from "../components";

class MockRenderer implements Renderer {
  render = test.mock.fn();
  setSize(): void {
    return;
  }
  domElement: HTMLCanvasElement = null as unknown as HTMLCanvasElement;
}

test("it renders the scene", () => {
  state.renderer = new MockRenderer();
  state.scene = null as unknown as Scene;
  state.camera = null as unknown as Camera;
  RenderSystem();
  assert(
    (state.renderer.render as unknown as Mock<any>).mock.calls.length === 1,
  );
});

test("when sprites are added it adds them to the scene", () => {
  const mockTexture = new Texture();

  state.renderer = new MockRenderer();
  state.scene = new Scene();
  state.camera = null as unknown as Camera;

  const sceneChildren = state.scene.children;
  assert.equal(sceneChildren.length, 0);

  const sprite = state.addEntity();
  SpriteComponent2.add(sprite);
  if (SpriteComponent2.has(sprite)) {
    sprite.textureId = "testTex";
    state.addTexture(sprite.textureId, mockTexture);

    RenderSystem();
    assert.equal(sceneChildren.length, 1);
    RenderSystem();
    assert.equal(sceneChildren.length, 1);

    const child = sceneChildren[0] as Sprite;
    assert.equal(child, sprite.sprite);
  } else {
    throw new Error("entity was not added to SpriteComponent");
  }
});
