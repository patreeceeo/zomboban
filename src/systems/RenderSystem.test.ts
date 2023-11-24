import { update3DishSprite } from "./RenderSystem";
import test from "node:test";
import assert from "node:assert";
import { VoidContainer, VoidSprite } from "../functions/PixiHelpers";

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

  update3DishSprite(
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

  update3DishSprite(
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

  update3DishSprite(
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

  update3DishSprite(
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
