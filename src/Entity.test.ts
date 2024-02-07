import test from "node:test";
import assert from "node:assert";
import { EntityStore } from "./Entity";

test("EntityStore: multiple entities coexisting", () => {
  const store = new EntityStore();
  const entity1 = store.add();
  const entity2 = store.add();
  assert.strictEqual(entity1, 0);
  assert.strictEqual(entity2, 1);
});

test("EntityStore: remove", () => {
  const store = new EntityStore();
  const entity = store.add();
  store.remove(entity);
  for (const _entity of store.added) {
    assert.fail("EntityStore: remove failed");
  }
  // removed entity has not been recycled, therefore we can't reuse it
  assert.strictEqual(store.add(), 1);
});

test("EntityStore: recycle", () => {
  const store = new EntityStore();
  const entity = store.add();
  store.remove(entity);
  store.recycle(entity);
  assert.strictEqual(store.add(), 0);
});

test("EntityStore: full lifecycle with multiple entities", () => {
  const store = new EntityStore();
  const entity1 = store.add();
  const entity2 = store.add();
  store.remove(entity1);
  store.remove(entity2);
  store.recycle(entity1);
  store.recycle(entity2);
  assert.strictEqual(store.add(), 0);
  assert.strictEqual(store.add(), 1);
  assert(store.isSane());
});

test("EntityStore: add predetermined entities", () => {
  const store = new EntityStore();
  store.add(undefined, 1);
  assert.strictEqual(store.add(), 0);
  assert.strictEqual(store.add(), 2);
  assert(store.isSane());
});

test("EntityStore: add using factory", () => {
  const store = new EntityStore();
  let wasCalled = false;
  let entityId = -1;
  store.add((id) => {
    wasCalled = true;
    entityId = id;
  });
  assert(wasCalled);
  assert.strictEqual(entityId, 0);
});
