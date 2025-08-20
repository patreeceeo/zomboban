import assert from "node:assert";
import test from "node:test";
import { AnimationSystem } from "./AnimationSystem";
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
    return new Texture(new Image() as any);
  }
}

function setUp() {
  const state = new MockState({texture: {loader: fakeLoader as any}});
  const mgr = new SystemManager(state);
  const system = new AnimationSystem(mgr);
  system.start();
  return { state, system };
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
  const spriteEntity = state.addEntity();

  AnimationComponent.add(spriteEntity, {
    animation
  });
  TransformComponent.add(spriteEntity);
  system.start();
  system.update(state);

  await delay(0); // wait for the async texture load to complete
  const texture = state.texture.get("assets/texture.png");

  system.update(state);

  assert.notEqual(texture, undefined);
  assert.equal(getSprite(spriteEntity).material.map, texture);
});

test("using textures that have already been loaded", async () => {
  const { state, system } = setUp();

  const texture = await state.texture.load("assets/texture.png", "assets/texture.png");

  const entity = state.addEntity();
  AnimationComponent.add(entity, {
    animation
  });
  TransformComponent.add(entity);
  system.start();
  system.update(state);

  assert.equal(getSprite(entity).material.map, texture);
});

test("changing the clip index", async () => {
  const { state, system } = setUp();
  const entity = state.addEntity();
  AnimationComponent.add(entity, {
    animation
  });
  TransformComponent.add(entity);
  system.start();

  const texture = await state.texture.load("assets/texture2.png", "assets/texture2.png");

  entity.animation.clipIndex = 1;
  system.update(state);

  assert.equal(getSprite(entity).material.map, texture);
});
