import assert from "node:assert";
import test from "node:test";
import { AnimatedTextureLoaderSystem } from "./AnimatedTextureLoaderSystem";
import { MockState } from "../testHelpers";
import { SpriteComponent2 } from "../components";
import { Sprite, Texture } from "three";

const system = new AnimatedTextureLoaderSystem();

test.afterEach(() => {
  system.stop();
  SpriteComponent2.clear(true);
});

test("using textures that haven't yet been loaded", () => {
  const state = new MockState();
  const spriteEntity = {
    sprite: new Sprite(),
    animations: [
      {
        name: "default",
        duration: 0,
        tracks: [
          {
            name: "default",
            type: "string",
            values: ["assets/texture.png"],
            times: new Float32Array(1)
          }
        ]
      }
    ]
  };
  state.addQueryResult([SpriteComponent2], spriteEntity);
  system.start(state as any);

  const texture = state.getTexture("assets/texture.png");

  const previousTextureVersion = texture.version;
  texture.image!.onload!();

  assert(texture.version > previousTextureVersion);
  assert.equal(spriteEntity.sprite.material.map, texture);
});

test("using textures that have already been loaded", () => {
  const state = new MockState();
  const texture = new Texture();
  state.addTexture("assets/texture.png", texture);
  const spriteEntity = {
    sprite: new Sprite(),
    animations: [
      {
        name: "default",
        duration: 0,
        tracks: [
          {
            name: "default",
            type: "string",
            values: ["assets/texture.png"],
            times: new Float32Array(1)
          }
        ]
      }
    ]
  };
  state.addQueryResult([SpriteComponent2], spriteEntity);
  system.start(state as any);

  assert.equal(spriteEntity.sprite.material.map, texture);
});
