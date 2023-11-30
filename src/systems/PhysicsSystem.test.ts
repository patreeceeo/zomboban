import test from "node:test";
import assert from "node:assert";
import {
  PhysicsSystem,
  attemptPush,
  initializePhysicsSystem,
  isLineObstructed,
} from "./PhysicsSystem";
import { addEntity } from "../Entity";
import { removePosition, setPosition } from "../components/Position";
import { Layer, removeLayer, setLayer } from "../components/Layer";
import { getVelocityX } from "../components/VelocityX";
import { getPositionX } from "../components/PositionX";
import { getVelocityY } from "../components/VelocityY";
import { getPositionY } from "../components/PositionY";
import { removeVelocity, setVelocity } from "../components/Velocity";
import {
  ActLike,
  getActLike,
  removeActLike,
  setActLike,
  stringifyActLike,
} from "../components/ActLike";
import {
  TILEX_PPS,
  convertTilesXToPixels,
  convertTxpsToPps,
} from "../units/convert";
import { queryTile } from "../Tile";

const _ = undefined;
const b = ActLike.BARRIER;
const c = ActLike.PUSHABLE;
const p = ActLike.PLAYER;
const z = ActLike.ZOMBIE;

// TODO this could be replaced with a generalized version of testPush
function testCollisions(
  objects: Array<Array<ActLike | undefined>>,
  path: Array<[TilesX, TilesX]>,
  expectCollision = false,
) {
  const playerId = addEntity();
  setLayer(playerId, Layer.OBJECT);
  const objectIds = [];
  for (const [y, row] of objects.entries()) {
    for (const [x, actLike] of row.entries()) {
      if (actLike === undefined) continue;
      const id = addEntity();
      setLayer(id, Layer.OBJECT);
      setActLike(id, actLike);
      setPosition(
        id,
        convertTilesXToPixels(x as TilesX),
        convertTilesXToPixels(y as TilesX),
      );
      objectIds.push(id);
    }
  }

  initializePhysicsSystem();

  const [[startX, startY], ...rest] = path;
  setPosition(
    playerId,
    convertTilesXToPixels(startX),
    convertTilesXToPixels(startY),
  );

  try {
    for (const [index, [x, y]] of rest.entries()) {
      const [prevX, prevY] = path[index];
      const dx = (x - prevX) as Txps;
      const dy = (y - prevY) as Txps;
      const manhattan = Math.abs(dx) + Math.abs(dy);
      assert(
        manhattan > 0 && manhattan <= 2,
        `invalid path at index ${index + 1} manhattan distance is ${manhattan}`,
      );
      setVelocity(playerId, convertTxpsToPps(dx), convertTxpsToPps(dy));
      PhysicsSystem();

      if (index === rest.length - 1 && expectCollision) {
        assert.equal(
          getPositionX(playerId),
          convertTilesXToPixels(prevX),
          `incorrect x position at index ${index + 1}`,
        );
        assert.equal(
          getPositionY(playerId),
          convertTilesXToPixels(prevY),
          `incorrect y position at index ${index + 1}`,
        );
      } else {
        assert.equal(
          getPositionX(playerId),
          convertTilesXToPixels(x),
          `incorrect x position at index ${index + 1}`,
        );
        assert.equal(
          getPositionY(playerId),
          convertTilesXToPixels(y),
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
  } finally {
    removePosition(playerId);
    removeLayer(playerId);
    removeVelocity(playerId);
    for (const id of objectIds) {
      removePosition(id);
      removeLayer(id);
    }
  }
}

await test("PhysicsSystem: move along wall", () => {
  testCollisions(
    [
      [_, _, _],
      [b, b, b],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ] as Array<[TilesX, TilesX]>,
  );
  testCollisions(
    [
      [_, b],
      [_, b],
      [_, b],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
    ] as Array<[TilesX, TilesX]>,
  );
});

await test("PhysicsSystem: run into wall", () => {
  testCollisions(
    [[_], [b]],
    [
      [0, 0],
      [0, 1],
    ] as Array<[TilesX, TilesX]>,
    true,
  );
});

function testPush(
  initialWorld: Array<Array<ActLike | undefined>>,
  velocity: [Pps, Pps],
  expectedWorld: Array<Array<ActLike | undefined>>,
) {
  const objectIds = [];
  let playerId: number;
  for (const [y, row] of initialWorld.entries()) {
    for (const [x, actLike] of row.entries()) {
      if (actLike === undefined) continue;
      const id = addEntity();
      setLayer(id, Layer.OBJECT);
      setActLike(id, actLike);
      setPosition(
        id,
        convertTilesXToPixels(x as TilesX),
        convertTilesXToPixels(y as TilesX),
      );
      objectIds.push(id);
      if (actLike === ActLike.PLAYER) {
        playerId = id;
      }
    }
  }

  initializePhysicsSystem();

  setVelocity(playerId!, ...velocity);
  attemptPush(playerId!, ...velocity);
  PhysicsSystem();

  try {
    for (const [y, row] of expectedWorld.entries()) {
      for (const [x, expected] of row.entries()) {
        const id = queryTile(x as TilesX, y as TilesY);
        const actual = getActLike(id);
        assert.ok(
          expected === actual,
          `incorrect object at (${x}, ${y}), expected '${stringifyActLike(
            expected,
          )}' found '${stringifyActLike(actual)}'`,
        );
      }
    }
  } finally {
    for (const id of objectIds) {
      removePosition(id);
      removeLayer(id);
      removeActLike(id);
      removeVelocity(id);
    }
  }
}

await test("PhysicsSystem: push things", () => {
  testPush([[p, c]], [TILEX_PPS, 0 as Pps], [[, p, c]]);
  testPush([[, c, p]], [-TILEX_PPS as Pps, 0 as Pps], [[c, p]]);
  testPush([[p, c, c]], [TILEX_PPS, 0 as Pps], [[p, c, c]]);
  testPush([[p, c, b]], [TILEX_PPS, 0 as Pps], [[p, c, b]]);
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
      setPosition(
        id,
        convertTilesXToPixels(x as TilesX),
        convertTilesXToPixels(y as TilesX),
      );
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
    ActLike.BARRIER,
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

await test("PhysicsSystem: isLineObstructed", () => {
  // horizontal ok
  testIsLineObstructed([[p, _, z]], false);
  testIsLineObstructed(
    [
      [b, b, b],
      [p, _, z],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [b, b, b],
      [z, _, p],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [p, _, z],
      [b, b, b],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [z, _, p],
      [b, b, b],
    ],
    false,
  );

  // vertical ok
  testIsLineObstructed([[z], [_], [p]], false);
  testIsLineObstructed(
    [
      [b, z],
      [b, _],
      [b, p],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [b, p],
      [b, _],
      [b, z],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [z, b],
      [_, b],
      [p, b],
    ],
    false,
  );
  testIsLineObstructed(
    [
      [p, b],
      [_, b],
      [z, b],
    ],
    false,
  );

  // no diagonal!
  testIsLineObstructed(
    [
      [p, _, _],
      [_, _, _],
      [_, _, z],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [z, _, _],
      [_, _, _],
      [_, _, p],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [_, _, z],
      [_, _, _],
      [p, _, _],
    ],
    true,
  );
  testIsLineObstructed(
    [
      [_, _, p],
      [_, _, _],
      [z, _, _],
    ],
    true,
  );

  // barriers
  testIsLineObstructed([[p, b, z]], true);
  testIsLineObstructed([[z, b, p]], true);
  testIsLineObstructed([[p], [b], [z]], true);
  testIsLineObstructed([[z], [b], [p]], true);
});
