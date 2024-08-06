import test from "node:test";
import { Matrix } from "./Matrix";
import assert from "node:assert";

function createKeyTuples(min: number, max: number) {
  const result = [] as number[][];
  for (let z = min; z < max; z++)
    for (let y = min; y < max; y++)
      for (let x = min; x < max; x++) result.push([x, y, z]);
  return result;
}

test("Matrix", () => {
  const m = new Matrix<number>();
  assert.throws(() => m.set(0.5, 1, 1, 1));
  assert.throws(() => m.has(0.5, 1, 1));
  assert.throws(() => m.get(0.5, 1, 1));
  assert.throws(() => m.delete(0.5, 1, 1));
  assert.throws(() => m.set(1, 0.5, 1, 1));
  assert.throws(() => m.has(1, 0.5, 1));
  assert.throws(() => m.get(1, 0.5, 1));
  assert.throws(() => m.delete(1, 0.5, 1));

  const keyTuples = createKeyTuples(-3, 3);

  for (const [x, y, z] of keyTuples) {
    assert(!m.has(x, y, z));
    m.set(x, y, z, x + y + z);
  }

  for (const [x, y, z] of keyTuples) {
    assert(m.has(x, y, z));
    assert.strictEqual(m.get(x, y, z), x + y + z);
  }

  for (const [x, y, z] of keyTuples) {
    m.delete(x, y, z);
    assert(!m.has(x, y, z));
  }
  for (const [x, y, z] of keyTuples) {
    m.set(x, y, z, x + y + z);
  }
  m.clear();

  for (const [x, y, z] of keyTuples) {
    assert(!m.has(x, y, z));
  }
});

test("Matrix entries iterator includes negative indexes", () => {
  const m = new Matrix<number>();
  m.set(-1, -1, -1, 1);
  m.set(0, -1, -1, 3);
  m.set(-1, 0, -1, 2);
  m.set(0, 0, 0, 4);
  const entries = [...m.entries()];
  assert.deepStrictEqual(entries, [
    [-1, -1, -1, 1],
    [0, -1, -1, 3],
    [-1, 0, -1, 2],
    [0, 0, 0, 4]
  ]);
});
