import assert from "node:assert";
import test from "node:test";
import { makeReadonlyRecursively } from "./util";

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
