import assert from "node:assert";
import test from "node:test";
import { ComponentFilter, ComponentFilterRegistry, Query } from "./Query";
import { PrimativeArrayComponent } from "./Component";

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

test("ComponentFilterRegistry", () => {
  const registery = new ComponentFilterRegistry();
  const componentA = new PrimativeArrayComponent([] as number[]);
  const componentB = new PrimativeArrayComponent([] as number[]);
  const filter = new ComponentFilter([componentA, componentB]);
  const id = registery.register(filter);
  const id2 = registery.register(filter);
  assert.equal(id, id2);
});
