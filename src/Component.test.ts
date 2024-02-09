import test from "node:test";
import assert from "node:assert";
import { PrimativeArrayComponent } from "./Component";

test("PrimativeArrayComponent", () => {
  const NAME = "isVisible";
  const DATA = [] as boolean[];
  const Component = new PrimativeArrayComponent(NAME, DATA);
  Component.addSet(42, true);
  assert.equal(Component.get(42), true);
  assert.equal(Component.has(42), true);
  assert.equal(Component.has(0), false);
  assert.throws(() => Component.get(0));
  assert.equal(Component.get(0, true), true);
  assert.equal(Component.serialize(42), true);
  assert.throws(() => Component.serialize(0));
  Component.deserialize(0, false);
  assert.equal(Component.get(0), false);
});
