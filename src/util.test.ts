import assert from "node:assert";
import test from "node:test";
import { makeReadonlyRecursively, normalizeAngle } from "./util";

test("make a recursively read-only version of an object", () => {
  const obj = {
    a: {
      b: {
        c: {
          d: "d"
        }
      }
    },
    b: 2
  };
  const roObj = makeReadonlyRecursively(obj);
  assert.deepStrictEqual(roObj, obj);
  assert.notEqual(roObj, obj);
  assert.throws(() => {
    roObj.b = 3;
  });
  assert.throws(() => {
    roObj.a.b.c.d = "e";
  });
});

test("normalizeAngle", () => {
  assert.equal(normalizeAngle(0), 0);
  assert.equal(normalizeAngle(Math.PI), Math.PI);
  assert.equal(normalizeAngle(Math.PI * 2), 0);
  assert.equal(normalizeAngle(-Math.PI), Math.PI);
  assert.equal(normalizeAngle(-Math.PI * 2), 0);
});
