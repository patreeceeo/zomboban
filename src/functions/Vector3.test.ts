import assert from "node:assert";
import test from "node:test";
import { applySnappingToVector3 } from "./Vector3";
import { Vector3 } from "three";

test("vector3 with snapping", () => {
  const vec = applySnappingToVector3(new Vector3(), 10);
  vec.set(1.5, 2.5, 3.5);
  assert.equal(vec.x, 0);
  assert.equal(vec.y, 0);
  assert.equal(vec.z, 0);
  vec.set(6, 16, 26);
  assert.equal(vec.x, 10);
  assert.equal(vec.y, 20);
  assert.equal(vec.z, 30);
});
