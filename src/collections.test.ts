import test, { describe } from "node:test";
import { AutoIncrementIdentifierSet, NumberKeyedMap } from "./collections";
import assert from "node:assert";

describe("AutoIncrementIdentifierSet", () => {
  describe("nextValue", () => {
    test("it returns the lowest number that hasn't been added", () => {
      const idSet = new AutoIncrementIdentifierSet();

      idSet.add(1);
      idSet.add(2);
      idSet.add(4);
      idSet.add(7);

      assert.equal(idSet.nextValue(), 0);
      assert.equal(idSet.nextValue(), 0);
      idSet.add(0);

      assert.equal(idSet.nextValue(), 3);
      assert.equal(idSet.nextValue(), 3);
      idSet.add(3);

      assert.equal(idSet.nextValue(), 5);
      assert.equal(idSet.nextValue(), 5);
      idSet.add(5);

      assert.equal(idSet.nextValue(), 6);
      assert.equal(idSet.nextValue(), 6);
      idSet.add(6);
    });
  });
});

describe("NumberKeyedMap", () => {
  test("iterators", () => {
    const map = new NumberKeyedMap<string>();

    map.set(2, "two");
    map.set(3, "three");
    map.set(5, "five");

    assert.deepEqual(Array.from(map.keys()), [2, 3, 5]);

    assert.deepEqual(Array.from(map.values()), ["two", "three", "five"]);

    assert.deepEqual(Array.from(map.entries()), [
      [2, "two"],
      [3, "three"],
      [5, "five"]
    ]);
  });

  test("findEmtpyIndex", () => {
    const map = new NumberKeyedMap<string>();
    map.set(0, "zero");
    map.set(1, "one");
    map.set(3, "three");

    const emptyIndex = map.findEmtpyIndex();

    assert.equal(emptyIndex, 2);
  })
});
