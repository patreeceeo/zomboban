import {
  serializeEntityData,
  deserializeEntityData,
  serializeAllEntityComponentData,
  deserializeAllEntityComponentData,
} from "./Server";
import test from "node:test";
import assert from "node:assert";
import { PrimativeArrayComponent } from "../Component";

// const ComponentA = new class A extends PrimativeArrayComponent([] as number[]);
class A extends PrimativeArrayComponent<number> {}
class B extends PrimativeArrayComponent<string> {}

const componentA = new A([]);
const componentB = new B([]);
const components = {
  A: componentA,
  B: componentB,
};

test("serializeEntityData", () => {
  componentA.addSet(0, 13);
  componentB.addSet(0, "foo");

  const data0 = serializeEntityData(0, components);
  assert.equal(data0, `{"A":13,"B":"foo"}`);
});

test("deserializeEntityData", () => {
  deserializeEntityData(0, components, `{"A":24,"B":"qux"}`);
  assert.equal(componentA.get(0), 24);
  assert.equal(componentB.get(0), "qux");
});

test("serializeAllEntityComponentData", () => {
  componentA.addSet(0, 13);
  componentB.addSet(0, "foo");
  componentA.addSet(1, 37);
  componentB.addSet(1, "bar");
  const data = serializeAllEntityComponentData([0, 1, 2], components);
  assert.equal(data, `{"A":[13,37],"B":["foo","bar"]}`);
});

test("deserializeAllEntityComponentData", () => {
  deserializeAllEntityComponentData(
    components,
    `{"A":[24,37],"B":["qux","bar"]}`,
    () => {},
  );
  assert.equal(componentA.get(0), 24);
  assert.equal(componentB.get(0), "qux");
  assert.equal(componentA.get(1), 37);
  assert.equal(componentB.get(1), "bar");
});
