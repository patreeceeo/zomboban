import test from "node:test";
import assert from "node:assert";
import { PhysicsSystem, initializePhysicsSystem } from "./PhysicsSystem";
import { addEntity } from "../Entity";
import { removePosition, setPosition } from "../components/Position";
import { Layer, removeLayer, setLayer } from "../components/Layer";
import { getVelocityX } from "../components/VelocityX";
import { getPositionX } from "../components/PositionX";
import { SPRITE_SIZE } from "../components/Sprite";
import { getVelocityY } from "../components/VelocityY";
import { getPositionY } from "../components/PositionY";
import { setVelocity } from "../components/Velocity";
import { ActLike } from "../components/ActLike";

const b = ActLike.BARRIER;

function testCollisions(
  objects: Array<Array<ActLike | undefined>>,
  path: Array<[number, number]>,
  expectCollision = false,
) {
  const playerId = addEntity();
  setLayer(playerId, Layer.OBJECT);
  const objectIds = [];
  for (const [y, row] of objects.entries()) {
    for (const [x, cell] of row.entries()) {
      if (cell === undefined) continue;
      const id = addEntity();
      setLayer(id, Layer.OBJECT);
      setPosition(id, x * SPRITE_SIZE, y * SPRITE_SIZE);
      objectIds.push(id);
    }
  }

  initializePhysicsSystem();

  const [[startX, startY], ...rest] = path;
  setPosition(playerId, startX * SPRITE_SIZE, startY * SPRITE_SIZE);
  for (const [index, [x, y]] of rest.entries()) {
    const [prevX, prevY] = path[index];
    const dx = x - prevX;
    const dy = y - prevY;
    const manhattan = Math.abs(dx) + Math.abs(dy);
    assert(
      manhattan > 0 && manhattan <= 2,
      `invalid path at index ${index + 1} manhattan distance is ${manhattan}`,
    );
    setVelocity(playerId, dx * SPRITE_SIZE, dy * SPRITE_SIZE);
    PhysicsSystem();

    if (index === rest.length - 1 && expectCollision) {
      assert.equal(
        getPositionX(playerId),
        prevX * SPRITE_SIZE,
        `incorrect x position at index ${index + 1}`,
      );
      assert.equal(
        getPositionY(playerId),
        prevY * SPRITE_SIZE,
        `incorrect y position at index ${index + 1}`,
      );
    } else {
      assert.equal(
        getPositionX(playerId),
        x * SPRITE_SIZE,
        `incorrect x position at index ${index + 1}`,
      );
      assert.equal(
        getPositionY(playerId),
        y * SPRITE_SIZE,
        `incorrect y position at index ${index + 1}`,
      );
    }
    assert.equal(
      getVelocityX(playerId),
      0,
      `incorrect x velocity at index ${index + 1}`,
    );
    assert.equal(
      getVelocityY(playerId),
      0,
      `incorrect y velocity at index ${index + 1}`,
    );
  }

  removePosition(playerId);
  removeLayer(playerId);
  for (const id of objectIds) {
    removePosition(id);
    removeLayer(id);
  }
}

test("PhysicsSystem: move along wall", () => {
  testCollisions(
    [
      [, ,],
      [b, b, b],
      [, ,],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  );
  testCollisions(
    [
      [, b],
      [, b],
      [, b],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
  );
  testCollisions(
    [
      [b, ,],
      [, b],
      [, , b],
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  );
  testCollisions(
    [
      [b, ,],
      [, b],
      [, , b],
    ],
    [
      [1, 0],
      [2, 1],
      [3, 2],
    ],
  );
  testCollisions(
    [
      [, , b],
      [, b],
      [b, ,],
    ],
    [
      [1, 0],
      [0, 1],
      [-1, 2],
    ],
  );
  testCollisions(
    [
      [, , b],
      [, b],
      [b, ,],
    ],
    [
      [2, 1],
      [1, 2],
      [0, 3],
    ],
  );
});

test("PhysicsSystem: run into wall", () => {
  testCollisions(
    [[], [b]],
    [
      [0, 0],
      [0, 1],
    ],
    true,
  );
});
