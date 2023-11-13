import test from "node:test";
import assert from "node:assert";
import { plotLineSegment } from "./LineSegment.js";

function assertGeneratorsEqual<T>(g1: Generator<T>, g2: Generator<T>) {
  let v1 = g1.next();
  let v2 = g2.next();
  while (!v1.done && !v2.done) {
    assert.deepStrictEqual(v1.value, v2.value);
    v1 = g1.next();
    v2 = g2.next();
  }
  assert.strictEqual(v1.done, v2.done);
}

function* functionGeneratingArray<T>(array: T[]): Generator<T> {
  for (const value of array) {
    yield value;
  }
}

test("plotLineSegment", () => {
  assertGeneratorsEqual(
    plotLineSegment(0, 0, 3, 3),
    functionGeneratingArray([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ]),
  );
  assertGeneratorsEqual(
    plotLineSegment(0, 0, 0, 3),
    functionGeneratingArray([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ]),
  );
  assertGeneratorsEqual(
    plotLineSegment(0, 0, 3, 0),
    functionGeneratingArray([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ]),
  );
  assertGeneratorsEqual(
    plotLineSegment(3, 3, 0, 0),
    functionGeneratingArray([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ]),
  );
  assertGeneratorsEqual(
    plotLineSegment(0, 3, 0, 0),
    functionGeneratingArray([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ]),
  );
  assertGeneratorsEqual(
    plotLineSegment(3, 0, 0, 0),
    functionGeneratingArray([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ]),
  );
});
