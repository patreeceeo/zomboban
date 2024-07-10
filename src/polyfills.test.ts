import test from "node:test";
import { ExtendedArray } from "./polyfills";
import assert from "node:assert";

test("ExtendedArray#at", () => {
  const len = 5;
  const a = new Array(len);
  const ae = new ExtendedArray(len);
  for (const i of a.keys()) {
    a[i] = i;
    ae[i] = i;
  }

  for (const i of [0, 2, 4, 5, 6, -1, -2, -7]) {
    assert.equal(a.at(i), ae.at(i));
  }
});
