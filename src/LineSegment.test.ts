import test from "node:test";
import assert from "node:assert";
import { plotLineSegment } from "./LineSegment.js";

test("plotLineSegment", () => {
  assert.deepStrictEqual(plotLineSegment(0, 0, 3, 3), [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 3],
  ]);
  assert.deepStrictEqual(plotLineSegment(0, 0, 0, 3), [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ]);
  assert.deepStrictEqual(plotLineSegment(0, 0, 3, 0), [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ]);
  assert.deepStrictEqual(plotLineSegment(3, 3, 0, 0), [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 3],
  ]);
  assert.deepStrictEqual(plotLineSegment(0, 3, 0, 0), [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ]);
  assert.deepStrictEqual(plotLineSegment(3, 0, 0, 0), [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ]);
});
