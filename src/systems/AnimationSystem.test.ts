import assert from "node:assert";
import test from "node:test";
import { AnimationSystem, getSprite } from "./AnimationSystem";
import { MockState } from "../testHelpers";
import { SystemManager } from "../System";
import {
  AnimationClipJson,
  AnimationJson,
  KeyframeTrackJson
} from "../Animation";
import { AnimationComponent, TransformComponent } from "../components";
import { Texture } from "three";
import { Image } from "../globals";

function setUp() {
  const state = new MockState();
  state.addTexture("assets/texture.png", new Texture(new Image() as any));
  state.addTexture("assets/texture2.png", new Texture(new Image() as any));
  const mgr = new SystemManager(state);
  const system = new AnimationSystem(mgr);
  system.start(state);
  return { state, system };
}

test.afterEach(() => {
  AnimationComponent.clear();
  TransformComponent.clear();
});

const animation = new AnimationJson([
  new AnimationClipJson("default", 0, [
    new KeyframeTrackJson("default", "string", [0], ["assets/texture.png"])
  ]),
  new AnimationClipJson("another", 0, [
    new KeyframeTrackJson("default", "string", [0], ["assets/texture2.png"])
  ])
]);

test("using textures that haven't yet been loaded", () => {
  const { state, system } = setUp();
  const spriteEntity = {};

  AnimationComponent.add(spriteEntity, {
    animation
  });
  TransformComponent.add(spriteEntity);
  system.start(state as any);

  const texture = state.getTexture("assets/texture.png");

  assert.equal(getSprite(spriteEntity).material.map, texture);
});

test("using textures that have already been loaded", () => {
  const { state, system } = setUp();
  const texture = new Texture(new Image() as any);
  state.addTexture("assets/texture.png", texture);
  const entity = {};
  AnimationComponent.add(entity, {
    animation
  });
  TransformComponent.add(entity);
  system.start(state);

  assert.equal(getSprite(entity).material.map, texture);
});

test("changing the clip index", () => {
  const { state, system } = setUp();
  const entity = {};
  AnimationComponent.add(entity, {
    animation
  });
  TransformComponent.add(entity);
  system.start(state);

  const texture = state.getTexture("assets/texture2.png");

  entity.animation.clipIndex = 1;
  system.update(state);

  assert.equal(getSprite(entity).material.map, texture);
});
