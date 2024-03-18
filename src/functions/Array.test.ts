import assert from "node:assert";
import test from "node:test";
import { filterArrayInPlace } from "./Array";

test("filterArrayInPlace", () => {
  const array = [1, 2, 3, 4, 5];
  filterArrayInPlace(array, (value) => value % 2 === 0);
  assert.deepEqual(array, [2, 4]);
});
