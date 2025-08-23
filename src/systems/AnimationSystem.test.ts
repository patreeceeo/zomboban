import assert from "node:assert";
import test from "node:test";
import { AnimationSystem } from "./AnimationSystem";
import { LoadingSystem } from "./LoadingSystem";
import { MockState } from "../testHelpers";
import { SystemManager } from "../System";
import {
  AnimationClipJson,
  AnimationJson,
  KeyframeTrackJson
} from "../Animation";
import {
  AnimationComponent,
  SpriteComponent,
  TransformComponent
} from "../components";
import { Texture } from "three";
import { Image } from "../globals";
import { EntityWithComponents } from "../Component";
import {delay} from "../util";

function getSprite(entity: any) {
  return (entity as EntityWithComponents<typeof SpriteComponent>).sprite;
}

const fakeLoader = {
  loadAsync: async () => {
    const img = new Image() as any;
    img.naturalWidth = 64;
    img.naturalHeight = 64;
    return new Texture(img);
  }
}

function setUp() {
  const state = new MockState({texture: {loader: fakeLoader as any}});
  const mgr = new SystemManager(state);
  const animationSystem = new AnimationSystem(mgr);
  const loadingSystem = new LoadingSystem(mgr);
  animationSystem.start();
  loadingSystem.start(state);
  return { state, system: animationSystem, loadingSystem };
}


const animation = new AnimationJson([
  new AnimationClipJson("default", 0, [
    new KeyframeTrackJson("default", "string", [0], ["assets/texture.png"])
  ]),
  new AnimationClipJson("another", 0, [
    new KeyframeTrackJson("default", "string", [0], ["assets/texture2.png"])
  ])
]);

test("using textures that haven't yet been loaded", async () => {
  const { state, system } = setUp();
  const spriteEntity = state.world.addEntity();

  AnimationComponent.add(spriteEntity, {
    animation
  });
  TransformComponent.add(spriteEntity);
  system.start();
  system.update(state);

  await delay(10); // wait for the async texture load to complete
  const texture = state.texture.get("assets/texture.png");

  system.update(state);

  assert.notEqual(texture, undefined);
  assert(SpriteComponent.has(spriteEntity), "Entity should have SpriteComponent");
  assert.equal(getSprite(spriteEntity).material.map, texture);
});

test("using textures that have already been loaded", async () => {
  const { state, system } = setUp();

  const texture = await state.texture.load("assets/texture.png", "assets/texture.png");

  const entity = state.world.addEntity();
  AnimationComponent.add(entity, {
    animation
  });
  TransformComponent.add(entity);
  system.start();
  system.update(state);

  assert(SpriteComponent.has(entity), "Entity should have SpriteComponent");
  assert.equal(getSprite(entity).material.map, texture);
});

test("changing the clip index", async () => {
  const { state, system } = setUp();
  const entity = state.world.addEntity();
  AnimationComponent.add(entity, {
    animation
  });
  TransformComponent.add(entity);
  system.start();
  system.update(state); // Need initial update to add SpriteComponent

  // Pre-load the texture that will be used by clip index 1
  const texture = await state.texture.load("assets/texture2.png", "assets/texture2.png");

  entity.animation.clipIndex = 1;
  system.update(state);

  assert(SpriteComponent.has(entity), "Entity should have SpriteComponent");
  assert.equal(getSprite(entity).material.map, texture);
});
