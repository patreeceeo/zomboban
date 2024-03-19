import assert from "node:assert";
import test from "node:test";
import {
  SystemQueryMixin,
  System,
  SystemManager,
  SystemWithQueries
} from "./System";
import { defineComponent } from "./Component";
import { IQueryResults, QueryManager } from "./Query";
import { QueryState } from "./state";

test("starting a system", () => {
  const spy = test.mock.fn();
  const context = {};
  class MySystem extends System<{}> {
    start = spy;
  }
  const mgr = new SystemManager();
  mgr.push(MySystem, context);
  mgr.push(MySystem, context);

  assert(spy.mock.calls.length === 1);
  assert(spy.mock.calls[0].arguments[0] === context);
});

test("updating systems", () => {
  const spy = test.mock.fn();
  const spy2 = test.mock.fn();
  const constructorSpy = test.mock.fn();
  class MySystem extends System<{}> {
    constructor() {
      super();
      constructorSpy();
    }
    update = spy;
  }
  class MySystem2 extends System<{}> {
    constructor() {
      super();
      constructorSpy();
    }
    update = spy2;
  }
  const mgr = new SystemManager();
  const context = {};
  mgr.push(MySystem, context);
  mgr.update(context);
  mgr.push(MySystem2, context);
  mgr.update(context);
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

  const mgr = new SystemManager();

  const context = {};
  mgr.push(MySystem, context);
  mgr.updateServices(context);

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
  const mgr = new SystemManager();
  mgr.push(MySystem, context);
  mgr.remove(MySystem, context);
  mgr.update({});
  mgr.updateServices({});
  assert.equal(stopSpy.mock.calls.length, 1);
  assert.equal(stopSpy.mock.calls[0].arguments[0], context);
  assert.equal(updateSpy.mock.calls.length, 0);
});

test("nesting systems", () => {
  const context = { counter: 0 };
  const mgr = new SystemManager();
  const spy = test.mock.fn();
  const nestedSpy = test.mock.fn();
  class MySystem extends System<{}> {
    start() {
      this.mgr.push(MyEarlierSystem, context);
    }
    update(context: { counter: number }) {
      spy(context.counter);
      context.counter++;
    }
  }
  class MyEarlierSystem extends System<{}> {
    update(context: { counter: number }) {
      nestedSpy(context.counter);
      context.counter++;
    }
  }

  mgr.push(MySystem, context);
  mgr.update(context);

  assert(spy.mock.calls.length === 1);
  assert(nestedSpy.mock.calls.length === 1);
  assert.equal(spy.mock.calls[0].arguments[0], 1);
  assert.equal(nestedSpy.mock.calls[0].arguments[0], 0);
});

test("declaring queries in systems (mixin)", () => {
  const MyComponent = defineComponent();

  const MySystemWithQueries = SystemQueryMixin(
    class MySystem extends System<{}> {
      declare myEntities: IQueryResults<typeof MyComponent>;
    },
    {
      myEntities: { components: [MyComponent] }
    },
    (self, queryResultsMap) => {
      Object.assign(self, queryResultsMap);
    }
  );

  const mgr = new SystemManager();
  const qm = new QueryManager();
  const context = {
    query: test.mock.fn((components) => qm.query(components))
  };

  mgr.push(MySystemWithQueries, context);

  assert.equal(context.query.mock.calls.length, 1);
  assert.deepEqual(context.query.mock.calls[0].arguments[0], [MyComponent]);
  assert.equal((mgr.systems[0] as any).myEntities, qm.query([MyComponent]));
});

test("declaring queries in systems (derived class)", () => {
  const MyComponent = defineComponent();

  class MySystem extends SystemWithQueries<QueryState> {
    queryDefMap = {
      myEntities: { components: [MyComponent] }
    };
    myEntities!: IQueryResults<typeof MyComponent>;
  }

  const mgr = new SystemManager();
  const qm = new QueryManager();
  const context = {
    query: test.mock.fn((components) => qm.query(components))
  };

  mgr.push(MySystem, context);

  assert.equal(context.query.mock.calls.length, 1);
  assert.deepEqual(context.query.mock.calls[0].arguments[0], [MyComponent]);
  assert.equal(
    (mgr.systems[0] as MySystem).myEntities,
    qm.query([MyComponent])
  );
});
