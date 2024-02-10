import test from "node:test";
import assert from "node:assert";
import { PrimativeArrayComponent } from "./Component";

test("PrimativeArrayComponent: add set has get", () => {
  const Component = new PrimativeArrayComponent("foo", [] as boolean[]);
  Component.addSet(42, true);
  assert.equal(Component.get(42), true);
  assert.equal(Component.has(42), true);
  assert.equal(Component.has(0), false);
  assert.throws(() => Component.get(0));
  assert.equal(Component.get(0, true), true);
});

test("PrimativeArrayComponent: serialize deserialize", () => {
  const Component = new PrimativeArrayComponent("foo", [] as boolean[]);
  Component.addSet(42, true);
  assert.equal(Component.serialize(42), true);
  assert.throws(() => Component.serialize(0));
  Component.deserialize(0, false);
  assert.equal(Component.get(0), false);
});

test("PrimativeArrayComponent: remove", () => {
  const Component = new PrimativeArrayComponent("foo", [] as boolean[]);
  Component.addSet(42, true);
  Component.addSet(23, true);
  Component.remove(42);
  assert(!Component.has(42));

  // ok to remove non-existent
  Component.remove(3490);
});

test("PrimativeArrayComponent: size", () => {
  const Component = new PrimativeArrayComponent("foo", [] as boolean[]);
  Component.addSet(42, true);
  Component.addSet(23, true);
  assert.equal(Component.size, 2);
  Component.remove(42);
  assert.equal(Component.size, 1);
});

test("PrimativeArrayComponent: keys", () => {
  const Component = new PrimativeArrayComponent("foo", [] as boolean[]);
  Component.addSet(42, true);
  Component.addSet(23, true);
  const entries = Component.keys();
  assert.equal(entries.next().value, 42);
  assert.equal(entries.next().value, 23);
});
