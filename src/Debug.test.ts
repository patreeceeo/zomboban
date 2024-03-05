import assert from "assert";
import test from "node:test";
import {
  setDebugAlias,
  getDebugAlias,
  setLateBindingDebugAlias
} from "./Debug";

test("debug alias", () => {
  const obj = {
    nested: {}
  } as { nested?: {} };
  const map = new Map();
  const num = 5;
  setDebugAlias(obj, "my object");
  setDebugAlias(obj.nested!, "my nested object");
  setDebugAlias(map, "my map");
  assert.throws(() => setDebugAlias(num as any, "my number"));
  assert.strictEqual(getDebugAlias(obj), "my object");
  assert.strictEqual(getDebugAlias(map), "my map");
  assert.strictEqual(getDebugAlias(obj.nested), "my nested object");

  assert.throws(() => setDebugAlias(obj, "my favorite object"));
  setDebugAlias(obj, "my favorite object", true);
  assert.strictEqual(getDebugAlias(obj), "my favorite object");

  class Foo {}
  class Bar {
    foo = new Foo();
    constructor() {
      setLateBindingDebugAlias(this.foo, () => `${getDebugAlias(this)}'s foo`);
    }
  }

  const bar = new Bar();
  setDebugAlias(bar, "my bar");
  assert.strictEqual(getDebugAlias(bar.foo), "my bar's foo");
});
