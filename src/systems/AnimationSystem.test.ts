import assert from "node:assert";
import test from "node:test";
import { AnimationSystem } from "./AnimationSystem";
import { MockState } from "../testHelpers";
import { SpriteComponent2 } from "../components";
import { Texture } from "three";
import { Image } from "../globals";

const system = new AnimationSystem();

test.afterEach(() => {
  system.stop();
  SpriteComponent2.clear();
});

test("using textures that haven't yet been loaded", () => {
  const state = new MockState();
  const spriteEntity = {};
  SpriteComponent2.add(spriteEntity, {
    animation: {
      clipIndex: 0,
      playing: false,
      clips: [
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
    }
  });
  system.start(state as any);

  const texture = state.getTexture("assets/texture.png");

  const previousTextureVersion = texture.version;
  texture.image!.onload!();

  assert(texture.version > previousTextureVersion);

  assert.equal(spriteEntity.sprite.material.map, texture);
});

test("using textures that have already been loaded", () => {
  const state = new MockState();
  const texture = new Texture(new Image() as any);
  state.addTexture("assets/texture.png", texture);
  const spriteEntity = {};
  SpriteComponent2.add(spriteEntity, {
    animation: {
      clipIndex: 0,
      playing: false,
      clips: [
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
    }
  });
  system.start(state as any);

  assert.equal(spriteEntity.sprite.material.map, texture);
});

test("changing the clip index", () => {
  const state = new MockState();
  const spriteEntity = {};
  SpriteComponent2.add(spriteEntity, {
    animation: {
      clipIndex: 0,
      playing: false,
      clips: [
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
        },
        {
          name: "default",
          duration: 0,
          tracks: [
            {
              name: "default",
              type: "string",
              values: ["assets/texture2.png"],
              times: new Float32Array(1)
            }
          ]
        }
      ]
    }
  });
  system.start(state as any);

  const texture = state.getTexture("assets/texture2.png");

  spriteEntity.animation.clipIndex = 1;
  system.update(state as any);

  assert.equal(spriteEntity.sprite.material.map, texture);
});
