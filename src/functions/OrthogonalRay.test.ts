import test from "node:test";
import assert from "node:assert";
import { listPointsInOrthogonalRay } from "./OrthogonalRay";

test("listPointsInOrthogonalRay", () => {
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, 0, 0, 0), []);
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, 0, 1, 0), [[1, 0]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(1, 0, 0, 0), [[0, 0]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, 0, 0, 1), [[0, 1]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, 1, 0, 0), [[0, 0]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, 0, -1, 0), [[-1, 0]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, -1, 0, 0), [[0, 0]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, 0, 0, -1), [[0, -1]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, -1, 0, 0), [[0, 0]]);

  assert.deepStrictEqual(listPointsInOrthogonalRay(2, 0, 1, 0), [[1, 0]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(1, 0, 2, 0), [[2, 0]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, 2, 0, 1), [[0, 1]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, 1, 0, 2), [[0, 2]]);

  assert.deepStrictEqual(listPointsInOrthogonalRay(-2, 0, -1, 0), [[-1, 0]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(-1, 0, -2, 0), [[-2, 0]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, -2, 0, -1), [[0, -1]]);
  assert.deepStrictEqual(listPointsInOrthogonalRay(0, -1, 0, -2), [[0, -2]]);
});
