import {
  serializeEntityData,
  deserializeEntityData,
  serializeAllEntityComponentData,
  deserializeAllEntityComponentData,
} from "./Server";
import test from "node:test";
import assert from "node:assert";
import { PrimativeArrayComponent } from "../Component";

const ComponentA = new PrimativeArrayComponent("A", [] as number[]);
const ComponentB = new PrimativeArrayComponent("B", [] as string[]);
const components = {
  A: ComponentA,
  B: ComponentB,
};

test("serializeEntityData", () => {
  ComponentA.addSet(0, 13);
  ComponentB.addSet(0, "foo");

  const data0 = serializeEntityData(0, components);
  assert.equal(data0, `{"A":13,"B":"foo"}`);
});

test("deserializeEntityData", () => {
  deserializeEntityData(0, components, `{"A":24,"B":"qux"}`);
  assert.equal(ComponentA.get(0), 24);
  assert.equal(ComponentB.get(0), "qux");
});

test("serializeAllEntityComponentData", () => {
  ComponentA.addSet(0, 13);
  ComponentB.addSet(0, "foo");
  ComponentA.addSet(1, 37);
  ComponentB.addSet(1, "bar");
  const data = serializeAllEntityComponentData([0, 1, 2], components);
  assert.equal(data, `{"A":[13,37],"B":["foo","bar"]}`);
});

test("deserializeAllEntityComponentData", () => {
  deserializeAllEntityComponentData(
    components,
    `{"A":[24,37],"B":["qux","bar"]}`,
    () => {},
  );
  assert.equal(ComponentA.get(0), 24);
  assert.equal(ComponentB.get(0), "qux");
  assert.equal(ComponentA.get(1), 37);
  assert.equal(ComponentB.get(1), "bar");
});
