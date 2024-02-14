import assert from "node:assert";
import test from "node:test";
import {
  ComponentFilterEntitySource,
  ComponentFilterRegistry,
  Query,
} from "./Query";
import { ComponentRegistry, PrimativeArrayComponent } from "./Component";

const entitySource = { get: () => [1, 2, 3, 4] };
test("Query: basic", () => {
  const query = Query.build(entitySource).complete(
    ({ entityId }) => entityId % 2 !== 0,
  );
  assert.deepEqual(query(), [1, 3]);
});

test("Query: with param", () => {
  const query = Query.build(entitySource)
    .addParam("mod", 0)
    .complete(({ entityId, mod }) => entityId % 2 === mod);

  assert.throws(() => assert.deepEqual(query(), [1, 3]));

  query.setParam("mod", 0);

  assert.deepEqual(query(), [2, 4]);
});

test("ComponentFilterRegistry: prevents duplicates", () => {
  const registry = new ComponentFilterRegistry();
  const componentA = new PrimativeArrayComponent([] as number[]);
  const componentB = new PrimativeArrayComponent([] as number[]);
  const filter = new ComponentFilterEntitySource([componentA, componentB]);

  const id = registry.register(filter);
  const id2 = registry.register(filter);
  assert.equal(id, id2);

  const filter2 = new ComponentFilterEntitySource([componentA, componentB]);
  const id3 = registry.register(filter2);

  assert.equal(id, id3);
});

test("ComponentFilterRegistry: recognizes differences", () => {
  const registry = new ComponentFilterRegistry();
  const componentA = new PrimativeArrayComponent([] as number[]);
  const componentB = new PrimativeArrayComponent([] as number[]);
  const componentC = new PrimativeArrayComponent([] as number[]);
  const filter = new ComponentFilterEntitySource([componentA, componentB]);
  const moreSpecific = new ComponentFilterEntitySource([
    componentA,
    componentB,
    componentC,
  ]);
  const id = registry.register(filter);
  const id2 = registry.register(moreSpecific);

  assert.notEqual(id, id2);
});

class ComponentA extends PrimativeArrayComponent<number> {
  constructor() {
    super([]);
  }
}

class ComponentB extends PrimativeArrayComponent<number> {
  constructor() {
    super([]);
  }
}

test("Query.buildWithComponentFilterEntitySource", () => {
  const filterRegistry = new ComponentFilterRegistry();

  const componentRegistry = new ComponentRegistry(
    (_klass, entityId) => {
      for (const filter of filterRegistry.values()) {
        filter.handleAdd(entityId);
      }
    },
    (_klass, entityId) => {
      for (const filter of filterRegistry.values()) {
        filter.handleRemove(entityId);
      }
    },
  );
  componentRegistry.register(new ComponentA());
  componentRegistry.register(new ComponentB());

  componentRegistry.get(ComponentA).addSet(1, 16);
  componentRegistry.get(ComponentB).addSet(1, 32);

  const query = Query.buildWithComponentFilterEntitySource(
    componentRegistry,
    filterRegistry,
    [ComponentA, ComponentB],
    [1],
  ).complete();

  componentRegistry.get(ComponentA).addSet(2, 23);
  componentRegistry.get(ComponentB).addSet(2, 108);
  componentRegistry.get(ComponentB).remove(2);

  componentRegistry.get(ComponentA).addSet(3, 13);
  componentRegistry.get(ComponentB).addSet(3, 33);

  componentRegistry.get(ComponentB).addSet(4, 43);

  assert.deepEqual(query(), [1, 3]);
});
