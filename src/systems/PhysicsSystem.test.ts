import test from "node:test";
import assert from "node:assert";
import {
  PhysicsSystem,
  initializePhysicsSystem,
  isLineObstructed,
} from "./PhysicsSystem";
import { addEntity } from "../Entity";
import { removePosition, setPosition } from "../components/Position";
import { Layer, removeLayer, setLayer } from "../components/Layer";
import { getVelocityX } from "../components/VelocityX";
import { getPositionX } from "../components/PositionX";
import { SPRITE_SIZE } from "../components/Sprite";
import { getVelocityY } from "../components/VelocityY";
import { getPositionY } from "../components/PositionY";
import { setVelocity } from "../components/Velocity";
import { ActLike, removeActLike, setActLike } from "../components/ActLike";

const b = ActLike.BARRIER;
const p = ActLike.PLAYER;
const z = ActLike.ZOMBIE;

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

function testIsLineObstructed(
  objects: Array<Array<ActLike | undefined>>,
  expected: boolean,
) {
  const objectIds: Array<number> = [];
  let playerTileX: number;
  let playerTileY: number;
  let zombieTileX: number;
  let zombieTileY: number;
  for (const [y, row] of objects.entries()) {
    for (const [x, actLike] of row.entries()) {
      if (actLike === undefined) continue;
      const id = addEntity();
      setLayer(id, Layer.OBJECT);
      setPosition(id, x * SPRITE_SIZE, y * SPRITE_SIZE);
      setActLike(id, actLike);
      if (actLike === ActLike.PLAYER) {
        playerTileX = x;
        playerTileY = y;
      }
      if (actLike === ActLike.ZOMBIE) {
        zombieTileX = x;
        zombieTileY = y;
      }
      objectIds.push(id);
    }
  }

  assert(playerTileX! !== undefined, "playerX is undefined");
  assert(playerTileY! !== undefined, "playerY is undefined");
  assert(zombieTileX! !== undefined, "zombieX is undefined");
  assert(zombieTileY! !== undefined, "zombieY is undefined");
  initializePhysicsSystem();
  const result = isLineObstructed(
    playerTileX!,
    playerTileY!,
    zombieTileX!,
    zombieTileY!,
  );
  assert.equal(
    result,
    expected,
    `isLineObstructed returned ${result} but expected ${expected}`,
  );

  for (const id of objectIds) {
    removePosition(id);
    removeLayer(id);
    removeActLike(id);
  }
}

test("PhysicsSystem: isLineObstructed", () => {
  testIsLineObstructed(
    [
      [, ,],
      [p, , z],
      [, ,],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [b, b, b],
      [p, , z],
      [, ,],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [b, b, b],
      [z, , p],
      [, ,],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [, ,],
      [p, , z],
      [b, b, b],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [, ,],
      [z, , p],
      [b, b, b],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [b, z],
      [b, ,],
      [b, p],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [b, p],
      [b, ,],
      [b, z],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [, z, b],
      [, , b],
      [, p, b],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [, b],
      [p, b, z],
      [, b],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [, b],
      [z, b, p],
      [, b],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [, p],
      [b, b, b],
      [, z],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [, z],
      [b, b, b],
      [, p],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [b, z],
      [p, b],
      [, , b],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [b, p],
      [z, b],
      [, , b],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [, p, b],
      [, b, z],
      [b, ,],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [, z, b],
      [, b, p],
      [b, ,],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [p, , , b],
      [, , b],
      [, b, ,],
      [b, , , z],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [, , z],
      [b, p],
      [, b],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [, , p],
      [b, z],
      [, b],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [, b],
      [, p, b],
      [z, ,],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [, b],
      [, z, b],
      [p, ,],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [, b],
      [b, z],
      [, , p],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [, b],
      [b, p],
      [, , z],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [z, ,],
      [, p, b],
      [, b],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [p, ,],
      [, z, b],
      [, b],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [, , p],
      [, z, b],
      [, b],
    ],
    false,
  );
});
