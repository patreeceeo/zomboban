import test from "node:test";
import assert from "node:assert";
import { getCollisions, placeObjectInTile } from "./Tile";

test("Tile Collision", () => {
  placeObjectInTile(1, 1 as TilesX, 1 as TilesY);
  placeObjectInTile(2, 1 as TilesX, 1 as TilesY);
  const collisions = getCollisions();
  assert.strictEqual(collisions.length, 2);
  if (collisions[0].entityId === 1) {
    assert.deepEqual(collisions[0].otherIds, [2]);
    assert.deepEqual(collisions[1].otherIds, [1]);
  }
  if (collisions[0].entityId === 2) {
    assert.deepEqual(collisions[0].otherIds, [1]);
    assert.deepEqual(collisions[1].otherIds, [2]);
  }
});
