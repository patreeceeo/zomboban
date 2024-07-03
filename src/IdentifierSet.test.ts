import test, { describe } from "node:test";
import { AutoIncrementIdentifierSet } from "./IdentifierSet";
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
