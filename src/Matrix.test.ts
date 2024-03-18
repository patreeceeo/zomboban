import test from "node:test";
import { Matrix } from "./Matrix";
import assert from "node:assert";

await test("Matrix", () => {
  const m = new Matrix<number>();
  assert.throws(() => m.set(0.5, 1, 1));
  assert.throws(() => m.has(0.5, 1));
  assert.throws(() => m.get(0.5, 1));
  assert.throws(() => m.delete(0.5, 1));
  assert.throws(() => m.set(1, 0.5, 1));
  assert.throws(() => m.has(1, 0.5));
  assert.throws(() => m.get(1, 0.5));
  assert.throws(() => m.delete(1, 0.5));
  for (let x = -10; x < 10; x++) {
    for (let y = -10; y < 10; y++) {
      assert(!m.has(x, y));
      m.set(x, y, x + y);
    }
  }
  for (let x = -10; x < 10; x++) {
    for (let y = -10; y < 10; y++) {
      assert(m.has(x, y));
      assert.strictEqual(m.get(x, y), x + y);
    }
  }

  for (let x = -10; x < 10; x++) {
    for (let y = -10; y < 10; y++) {
      m.delete(x, y);
      assert(!m.has(x, y));
    }
  }
  for (let x = -10; x < 10; x++) {
    for (let y = -10; y < 10; y++) {
      m.set(x, y, x + y);
    }
  }
  m.clear();
  for (let x = -10; x < 10; x++) {
    for (let y = -10; y < 10; y++) {
      assert(!m.has(x, y));
    }
  }
});

test("Matrix entries iterator includes negative indexes", () => {
  const m = new Matrix<number>();
  m.set(-1, -1, 1);
  m.set(-1, 0, 2);
  m.set(0, -1, 3);
  m.set(0, 0, 4);
  const entries = [...m.entries()];
  assert.deepStrictEqual(entries, [
    [-1, -1, 1],
    [0, -1, 3],
    [-1, 0, 2],
    [0, 0, 4]
  ]);
});
