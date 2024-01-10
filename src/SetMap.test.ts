import test from "node:test";
import assert from "node:assert";
import { SetMap } from "./SetMap";

test("SetMap", () => {
  const setMap = new SetMap<number, string>();
  setMap.add(1, "a");
  setMap.add(1, "b");
  setMap.add(2, "c");
  setMap.add(2, "d");

  assert(setMap.hasKey(1));
  assert(setMap.hasKey(2));
  assert(!setMap.hasKey(3));

  let iterator = setMap.getValues(1);
  assert.equal(iterator.next().value, "a");
  assert.equal(iterator.next().value, "b");
  assert(iterator.next().done);

  iterator = setMap.getValues(2);
  assert.equal(iterator.next().value, "c");
  assert.equal(iterator.next().value, "d");
  assert(iterator.next().done);

  setMap.deleteValue(1, "a");
  assert(setMap.hasKey(1));
  iterator = setMap.getValues(1);
  assert.equal(iterator.next().value, "b");
  assert(iterator.next().done);

  setMap.deleteValue(1, "b");
  assert(!setMap.hasKey(1));

  setMap.deleteKey(2);
  assert(!setMap.hasKey(2));

  assert.throws(() => setMap.getValues(3));
});
