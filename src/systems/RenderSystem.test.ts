import assert from "node:assert";
import test, { Mock } from "node:test";
import { Renderer, Texture } from "three";
import { RenderSystem } from "./RenderSystem";
import { SpriteComponent2, TextureComponent } from "../components";
import { EntityWithComponents } from "../Component";

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
    getTexture: () => null,
    query() {
      return {
        stream() {
          return {
            unsubscribe() {
              return;
            }
          };
        }
      };
    }
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
    getTexture: () => mockTexture,
    queryEntities: [] as EntityWithComponents<
      typeof SpriteComponent2 | typeof TextureComponent
    >[],
    query: () => ({
      stream(
        cb: (
          entity: EntityWithComponents<
            typeof SpriteComponent2 | typeof TextureComponent
          >
        ) => void
      ) {
        for (const entity of state.queryEntities) {
          cb(entity);
        }
        return {
          unsubscribe: () => {
            return;
          }
        };
      }
    })
  } as any;

  const sprite = {};
  SpriteComponent2.add(sprite);
  TextureComponent.add(sprite, { textureId: "test" });
  state.queryEntities.push(sprite);

  assert.equal(scene.size, 0);

  system.start(state);

  system.update(state);
  assert.equal(scene.size, 1);
  system.update(state);
  assert.equal(scene.size, 1);

  assert(scene.has(sprite.sprite));
  system.stop();
});
