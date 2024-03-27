import assert from "node:assert";
import test from "node:test";
import { AnimationSystem } from "./AnimationSystem";
import { MockState } from "../testHelpers";
import { SpriteComponent2 } from "../components";
import { Texture } from "three";
import { Image } from "../globals";
import { IObservableSet } from "../Observable";
import { Animation, AnimationClip, KeyframeTrack } from "../Animation";
import { SystemManager } from "../System";

function setUp() {
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new AnimationSystem(mgr);
  system.start(state);
  return { state, system };
}

test.afterEach(() => {
  SpriteComponent2.clear();
  (SpriteComponent2.entities as IObservableSet<any>).unobserve();
});

const animation = new Animation([
  new AnimationClip("default", 0, [
    new KeyframeTrack("default", new Float32Array(1), ["assets/texture.png"])
  ]),
  new AnimationClip("another", 0, [
    new KeyframeTrack("default", new Float32Array(1), ["assets/texture2.png"])
  ])
]);

test("using textures that haven't yet been loaded", () => {
  const { state, system } = setUp();
  const spriteEntity = {};

  SpriteComponent2.add(spriteEntity, {
    animation
  });
  system.start(state as any);

  const texture = state.getTexture("assets/texture.png");

  const previousTextureVersion = texture.version;
  texture.image!.onload!();

  assert(texture.version > previousTextureVersion);

  assert.equal(spriteEntity.sprite.material.map, texture);
});

test("using textures that have already been loaded", () => {
  const { state, system } = setUp();
  const texture = new Texture(new Image() as any);
  state.addTexture("assets/texture.png", texture);
  const spriteEntity = {};
  SpriteComponent2.add(spriteEntity, {
    animation
  });
  system.start(state);

  assert.equal(spriteEntity.sprite.material.map, texture);
});

test("changing the clip index", () => {
  const { state, system } = setUp();
  const spriteEntity = {};
  SpriteComponent2.add(spriteEntity, {
    animation
  });
  system.start(state);

  const texture = state.getTexture("assets/texture2.png");

  spriteEntity.animation.clipIndex = 1;
  system.update(state);

  assert.equal(spriteEntity.sprite.material.map, texture);
});
