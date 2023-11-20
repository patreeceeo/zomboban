import {
  setUpParticleContainerArrays,
  update3DIshSprite,
} from "./RenderSystem";
import test from "node:test";
import assert from "node:assert";
import { VoidContainer, VoidSprite } from "../functions/PixiHelpers";

test("RenderSystem: set up particle container arrays", () => {
  type ParticleContainer = { tileY: number };
  type LayerContainer = Array<ParticleContainer>;
  const arrays: Array<Array<ParticleContainer>> = [[], [], []];
  const setUpParticleContainer = (tileY: number): ParticleContainer => {
    const particleContainer = {
      tileY,
    };
    layerContainer.push(particleContainer);
    return particleContainer;
  };
  const layerContainer: LayerContainer = [];
  setUpParticleContainerArrays(1, 0, 2, arrays, setUpParticleContainer);
  setUpParticleContainerArrays(3, 0, 2, arrays, setUpParticleContainer);

  assert.deepStrictEqual(arrays, [
    [, { tileY: 0 }, , { tileY: 0 }],
    [, { tileY: 1 }, , { tileY: 1 }],
    [, { tileY: 2 }, , { tileY: 2 }],
  ]);

  assert.deepStrictEqual(layerContainer, [
    { tileY: 0 },
    { tileY: 1 },
    { tileY: 2 },
    { tileY: 0 },
    { tileY: 1 },
    { tileY: 2 },
  ]);
});

class TestContainer implements VoidContainer<VoidSprite<{}>> {
  children: Array<VoidSprite<{}>> = [];
  addChild(...children: Array<VoidSprite<{}>>) {
    this.children.push(...children);
  }
  removeChild(...children: Array<VoidSprite<{}>>) {
    if (children.length !== 1) {
      throw new Error("Expected exactly one child");
    }
    const index = this.children.indexOf(children[0]);
    this.children.splice(index, 1);
  }
}

test("RenderSystem: update 3Dish sprite", () => {
  type Texture = {};
  const sprite: VoidSprite<Texture> = {
    x: 0,
    y: 0,
    texture: {},
  };
  const containerA = new TestContainer();
  const containerB = new TestContainer();

  const texture = {};

  update3DIshSprite(
    sprite,
    containerA,
    containerB,
    13 as Px,
    4 as TilesY,
    3 as TilesY,
    texture,
    true,
  );

  assert.deepStrictEqual(sprite, {
    x: 13,
    y: 0,
    texture,
  });
  assert.deepStrictEqual(containerA.children, [sprite]);
  assert.deepStrictEqual(containerB.children, []);

  update3DIshSprite(
    sprite,
    containerA,
    containerB,
    13 as Px,
    4 as TilesY,
    4 as TilesY,
    texture,
    false,
  );
  assert.deepStrictEqual(containerA.children, []);
  assert.deepStrictEqual(containerB.children, []);

  update3DIshSprite(
    sprite,
    containerA,
    containerB,
    13 as Px,
    4 as TilesY,
    5 as TilesY,
    texture,
    true,
  );
  assert.deepStrictEqual(containerA.children, [sprite]);
  assert.deepStrictEqual(containerB.children, []);

  update3DIshSprite(
    sprite,
    containerB,
    containerA,
    13 as Px,
    4 as TilesY,
    5 as TilesY,
    texture,
    false,
  );
  assert.deepStrictEqual(containerA.children, []);
  assert.deepStrictEqual(containerB.children, []);
});
