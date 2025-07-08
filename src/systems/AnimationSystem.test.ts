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

function getSprite(entity: any) {
  return (entity as EntityWithComponents<typeof SpriteComponent>).sprite;
}

function setUp() {
  const state = new MockState();
  state.addTexture("assets/texture.png", new Texture(new Image() as any));
  state.addTexture("assets/texture2.png", new Texture(new Image() as any));
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

test("using textures that haven't yet been loaded", () => {
  const { state, system } = setUp();
  const spriteEntity = state.addEntity();

  AnimationComponent.add(spriteEntity, {
    animation
  });
  TransformComponent.add(spriteEntity);
  system.start();
  system.update(state);

  const texture = state.getTexture("assets/texture.png");

  assert.equal(getSprite(spriteEntity).material.map, texture);
});

test("using textures that have already been loaded", () => {
  const { state, system } = setUp();
  const texture = new Texture(new Image() as any);
  state.addTexture("assets/texture.png", texture);
  const entity = state.addEntity();
  AnimationComponent.add(entity, {
    animation
  });
  TransformComponent.add(entity);
  system.start();
  system.update(state);

  assert.equal(getSprite(entity).material.map, texture);
});

test("changing the clip index", () => {
  const { state, system } = setUp();
  const entity = state.addEntity();
  AnimationComponent.add(entity, {
    animation
  });
  TransformComponent.add(entity);
  system.start();

  const texture = state.getTexture("assets/texture2.png");

  entity.animation.clipIndex = 1;
  system.update(state);

  assert.equal(getSprite(entity).material.map, texture);
});
