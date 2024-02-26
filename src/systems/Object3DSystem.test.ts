import assert from "node:assert";
import test, { Mock } from "node:test";
import { Camera, Renderer, Scene, Texture, Sprite } from "three";
import { Object3DSystem } from "./Object3DSystem";
import { state } from "../state";
import {
  LayerIdComponent,
  SpriteComponent,
  TextureComponent,
  TextureIdComponent,
} from "../components";
import { LayerId } from "../components/LayerId";

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
  Object3DSystem();
  assert(
    (state.renderer.render as unknown as Mock<any>).mock.calls.length === 1,
  );
});

test("when sprites are added it adds them to the scene", () => {
  const textureId = state.addEntity();
  const spriteId = state.addEntity();
  const mockTexture = new Texture();

  state.renderer = new MockRenderer();
  state.scene = new Scene();
  state.camera = null as unknown as Camera;
  state.acquire(SpriteComponent, spriteId);
  state.set(TextureComponent, textureId, mockTexture);
  state.set(TextureIdComponent, spriteId, textureId);
  state.set(LayerIdComponent, spriteId, LayerId.UI);

  const sceneChildren = state.scene.children;
  assert.equal(sceneChildren.length, 0);
  Object3DSystem();
  assert.equal(sceneChildren.length, 1);
  Object3DSystem();
  assert.equal(sceneChildren.length, 1);

  const child = sceneChildren[0] as Sprite;
  assert.equal(child, state.get(SpriteComponent, spriteId));
  assert(child instanceof Sprite);
  // assert(child.material.map === mockTexture);
});
