import {
  serializeEntityData,
  deserializeEntityData,
  serializeAllEntityComponentData,
  deserializeAllEntityComponentData,
} from "./Server";
import test from "node:test";
import assert from "node:assert";
import { PrimativeArrayComponent } from "../Component";

class A extends PrimativeArrayComponent<number> {}
class B extends PrimativeArrayComponent<string> {}

const componentA = new A([]);
const componentB = new B([]);
const components = [componentA, componentB];
// monkey-patch deserialize
const deserializeA = componentA.deserialize.bind(componentA);
const deserializeB = componentB.deserialize.bind(componentB);
// let deserializeOrder = 0;
let deserializedA = false;
let deserializedB = false;
componentA.deserialize = (...args: [number, any]) => {
  assert(!deserializedB, "components deserialized in the wrong order");
  deserializedA = true;
  deserializeA(...args);
};
componentB.deserialize = (...args: [number, any]) => {
  assert(deserializedA, "components deserialized in the wrong order");
  deserializedB = true;
  deserializeB(...args);
};

test("serializeEntityData", () => {
  componentA.set(0, 13);
  componentB.set(0, "foo");

  const data0 = serializeEntityData(0, components);
  assert.equal(data0, `{"A":13,"B":"foo"}`);
});

test("deserializeEntityData", () => {
  deserializedA = false;
  deserializedB = false;
  deserializeEntityData(0, components, `{"A":24,"B":"qux"}`);
  assert.equal(componentA.get(0), 24);
  assert.equal(componentB.get(0), "qux");
});

test("serializeAllEntityComponentData", () => {
  componentA.set(0, 13);
  componentB.set(0, "foo");
  componentA.set(1, 37);
  componentB.set(1, "bar");
  const data = serializeAllEntityComponentData([0, 1, 2], components);
  assert.equal(data, `{"A":[13,37],"B":["foo","bar"]}`);
});

test("deserializeAllEntityComponentData", () => {
  deserializedA = false;
  deserializedB = false;
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
