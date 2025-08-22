import assert from "node:assert";
import test from "node:test";
import { System, SystemManager, SystemWithQueries } from "./System";
import { defineComponent } from "./Component";
import { State } from "./state";
import { MockState, getMock } from "./testHelpers";
import { runMicrotasks } from "./util";

test("starting a system", () => {
  const spy = test.mock.fn();
  const context = {};
  class MySystem extends System<{}> {
    start = spy;
  }
  const mgr = new SystemManager(context);
  mgr.push(MySystem);
  mgr.push(MySystem);

  assert.equal(spy.mock.calls.length, 1, "System start should be called only once");
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

test("stopping a system", async () => {
  const context = {};
  const stopSpy = test.mock.fn();
  const updateSpy = test.mock.fn();
  class MySystem extends System<{}> {
    stop = stopSpy;
    update = updateSpy;
    services = [{ update: updateSpy }];
  }
  const mgr = new SystemManager(context);
  await mgr.push(MySystem);
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

test("using queries in systems", async () => {
  const context = new MockState();
  test.mock.method(context.query, "create");
  const MyComponent = defineComponent(class Foo {});
  const mgr = new SystemManager(context as State);
  class MySystem extends SystemWithQueries<State> {
    myQuery = this.createQuery([MyComponent]);
  }
  await mgr.push(MySystem);

  assert.equal(getMock(context.query.create).calls.length, 1);
  assert.deepEqual(getMock(context.query.create).calls[0].arguments[0], [MyComponent]);
  assert.equal(
    (mgr.systems[0] as MySystem).myQuery,
    getMock(context.query.create).calls[0].result
  );
});

test("async start method - update only calls ready systems", async () => {
  const startSpy = test.mock.fn();
  const updateSpy = test.mock.fn();
  const context = {};
  let resolveStart: () => void;
  
  class AsyncSystem extends System<{}> {
    async start(context: {}) {
      startSpy(context);
      return new Promise<void>((resolve) => {
        resolveStart = resolve;
      });
    }
    update(context: {}) {
      updateSpy(context);
    }
  }
  
  const mgr = new SystemManager(context);
  
  // Push the system - start should be called immediately
  mgr.push(AsyncSystem);
  await runMicrotasks();
  
  assert.equal(startSpy.mock.calls.length, 1);
  assert.equal(updateSpy.mock.calls.length, 0);
  
  // Call update while start is still pending - should not call system update
  mgr.update();
  assert.equal(updateSpy.mock.calls.length, 0);
  
  // Resolve the start promise
  resolveStart!();
  await runMicrotasks();
  
  // Now update should work
  mgr.update();
  assert.equal(updateSpy.mock.calls.length, 1);
  assert.equal(updateSpy.mock.calls[0].arguments[0], context);
});

test("async start method - insert only calls ready systems", async () => {
  const startSpy = test.mock.fn();
  const updateSpy = test.mock.fn();
  const context = {};
  let resolveStart: () => void;
  
  class AsyncSystem extends System<{}> {
    async start(context: {}) {
      startSpy(context);
      return new Promise<void>((resolve) => {
        resolveStart = resolve;
      });
    }
    update(context: {}) {
      updateSpy(context);
    }
  }
  
  const mgr = new SystemManager(context);
  
  // Insert the system - start should be called immediately
  mgr.insert(AsyncSystem, 0);
  await runMicrotasks();
  
  assert.equal(startSpy.mock.calls.length, 1);
  assert.equal(updateSpy.mock.calls.length, 0);
  
  // Call update while start is still pending - should not call system update
  mgr.update();
  assert.equal(updateSpy.mock.calls.length, 0);
  
  // Resolve the start promise
  resolveStart!();
  await runMicrotasks();
  
  // Now update should work
  mgr.update();
  assert.equal(updateSpy.mock.calls.length, 1);
});

test("mixed sync and async systems", async () => {
  const syncStartSpy = test.mock.fn();
  const syncUpdateSpy = test.mock.fn();
  const asyncStartSpy = test.mock.fn();
  const asyncUpdateSpy = test.mock.fn();
  const context = {};
  let resolveAsyncStart: () => void;
  
  class SyncSystem extends System<{}> {
    start(context: {}) {
      syncStartSpy(context);
    }
    update(context: {}) {
      syncUpdateSpy(context);
    }
  }
  
  class AsyncSystem extends System<{}> {
    async start(context: {}) {
      asyncStartSpy(context);
      return new Promise<void>((resolve) => {
        resolveAsyncStart = resolve;
      });
    }
    update(context: {}) {
      asyncUpdateSpy(context);
    }
  }
  
  const mgr = new SystemManager(context);
  
  // Add sync system first
  mgr.push(SyncSystem);
  
  // Add async system - push returns immediately
  mgr.push(AsyncSystem);
  await runMicrotasks();
  
  // Both start methods should be called
  assert.equal(syncStartSpy.mock.calls.length, 1);
  assert.equal(asyncStartSpy.mock.calls.length, 1);
  
  // Update should only call sync system's update (async not ready yet)
  mgr.update();
  assert.equal(syncUpdateSpy.mock.calls.length, 1);
  assert.equal(asyncUpdateSpy.mock.calls.length, 0);
  
  // Resolve async start
  resolveAsyncStart!();
  await runMicrotasks();
  
  // Now both should update
  mgr.update();
  assert.equal(syncUpdateSpy.mock.calls.length, 2);
  assert.equal(asyncUpdateSpy.mock.calls.length, 1);
});
