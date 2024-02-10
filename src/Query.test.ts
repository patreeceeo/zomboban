import assert from "node:assert";
import test from "node:test";
import { Query } from "./Query";

test("Query: basic", () => {
  const query = Query.build().complete(({ entityId }) => entityId % 2 !== 0);
  assert.deepEqual(query([1, 2, 3, 4]), [1, 3]);
});

test("Query: with param", () => {
  const query = Query.build()
    .addParam("mod", 0)
    .complete(({ entityId, mod }) => entityId % 2 === mod);

  assert.throws(() => assert.deepEqual(query([1, 2, 3, 4]), [1, 3]));

  query.setParam("mod", 0);

  assert.deepEqual(query([1, 2, 3, 4]), [2, 4]);
});
