import assert from "node:assert";
import test from "node:test";
import { System, SystemManager, SystemWithQueries } from "./System";
import { defineComponent } from "./Component";
import { QueryState } from "./state";
import { MockState, getMock } from "./testHelpers";

test("starting a system", () => {
  const spy = test.mock.fn();
  const context = {};
  class MySystem extends System<{}> {
    start = spy;
  }
  const mgr = new SystemManager(context);
  mgr.push(MySystem);
  mgr.push(MySystem);

  assert(spy.mock.calls.length === 1);
  assert(spy.mock.calls[0].arguments[0] === context);
});

test("updating systems", () => {
  const spy = test.mock.fn();
  const spy2 = test.mock.fn();
  const constructorSpy = test.mock.fn();
  class MySystem extends System<{}> {
    constructor(mgr: SystemManager<{}>) {
      super(mgr);
      constructorSpy();
    }
    update = spy;
  }
  class MySystem2 extends System<{}> {
    constructor(mgr: SystemManager<{}>) {
      super(mgr);
      constructorSpy();
    }
    update = spy2;
  }
  const context = {};
  const mgr = new SystemManager(context);
  mgr.push(MySystem);
  mgr.update();
  mgr.push(MySystem2);
  mgr.update();
  assert.equal(spy.mock.calls.length, 2);
  assert.equal(spy.mock.calls[0].arguments[0], context);
  assert.equal(spy2.mock.calls[0].arguments[0], context);
  assert.equal(constructorSpy.mock.calls.length, 2);
});

test("updating system services", () => {
  const spy = test.mock.fn();
  const service = {
    update: spy
  };
  class MySystem extends System<{}> {
    services = [service];
  }

  const context = {};
  const mgr = new SystemManager(context);

  mgr.push(MySystem);
  mgr.updateServices();

  assert.equal(spy.mock.calls.length, 1);
  assert.equal(spy.mock.calls[0].arguments[0], context);
});

test("stopping a system", () => {
  const context = {};
  const stopSpy = test.mock.fn();
  const updateSpy = test.mock.fn();
  class MySystem extends System<{}> {
    stop = stopSpy;
    update = updateSpy;
    services = [{ update: updateSpy }];
  }
  const mgr = new SystemManager(context);
  mgr.push(MySystem);
  mgr.remove(MySystem);
  mgr.update();
  mgr.updateServices();
  assert.equal(stopSpy.mock.calls.length, 1);
  assert.equal(stopSpy.mock.calls[0].arguments[0], context);
  assert.equal(updateSpy.mock.calls.length, 0);
});

test("nesting systems", () => {
  const context = { counter: 0 };
  const mgr = new SystemManager(context);
  const spy = test.mock.fn();
  const nestedSpy = test.mock.fn();
  class MySystem extends System<typeof context> {
    start() {
      this.mgr.push(MyEarlierSystem);
    }
    update(context: { counter: number }) {
      spy(context.counter);
      context.counter++;
    }
  }
  class MyEarlierSystem extends System<typeof context> {
    update(context: { counter: number }) {
      nestedSpy(context.counter);
      context.counter++;
    }
  }

  mgr.push(MySystem);
  mgr.update();

  assert(spy.mock.calls.length === 1);
  assert(nestedSpy.mock.calls.length === 1);
  assert.equal(spy.mock.calls[0].arguments[0], 1);
  assert.equal(nestedSpy.mock.calls[0].arguments[0], 0);
});

test("using queries in systems", () => {
  const context = new MockState();
  test.mock.method(context, "query");
  const MyComponent = defineComponent();
  const mgr = new SystemManager(context as QueryState);
  class MySystem extends SystemWithQueries<QueryState> {
    myQuery = this.createQuery([MyComponent]);
  }
  mgr.push(MySystem);

  assert.equal(getMock(context.query).calls.length, 1);
  assert.deepEqual(getMock(context.query).calls[0].arguments[0], [MyComponent]);
  assert.equal(
    (mgr.systems[0] as MySystem).myQuery,
    getMock(context.query).calls[0].result
  );
});
