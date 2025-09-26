import test, { describe } from "node:test";
import { ActionSystem } from "./ActionSystem";
import { BehaviorComponent } from "../components";
import { MockState } from "../testHelpers";
import assert from "node:assert";
import { SystemManager } from "../System";
import { World } from "../EntityManager";
import { Action } from "../Action";

class MockAction extends Action<any, any> {
  constructor(entity: any, startTime: number, maxElapsedTime: number) {
    super(entity, startTime, maxElapsedTime);
  }
  seek = test.mock.fn(super.seek);
  update = test.mock.fn((_context: any) => {});
}

describe("ActionSystem", () => {
  describe("processing pending actions", () => {
    const world = new World();
    const entity = world.addEntity();
    const state = new MockState();
    const mgr = new SystemManager(state);

    BehaviorComponent.add(entity, { behaviorId: "behavior/mock" as any });

    // The system currently assumes that all pending actions should be started immediately
    const actions = [
      new MockAction(entity, 0, 12),
      new MockAction(entity, 0, 15),
      new MockAction(entity, 0, 24)
    ];
    const system = new ActionSystem(mgr);

    system.start(state);

    // Make test agnostic to isPaused default value - we need the system to run
    state.time.isPaused = false;

    state.pendingActions.push(...actions);

    test("when dt is zero, nothing happens", () => {
      state.time.fixedDelta = 0;
      system.update(state);
      assert.equal(state.time.fixedTotal, 0);
      assert.equal(actions[0].progress, 0);
      assert.equal(actions[1].progress, 0);
      assert.equal(state.pendingActions.length, 3);
      assert.equal(entity.actions.sizeFlat, 3);
    });

    test("actions are moved to complete as time passes", () => {
      state.time.fixedDelta = 12;
      // Simulate SystemManager incrementing fixedTotal
      state.time.fixedTotal += state.time.fixedDelta;
      system.update(state);
      assert.equal(state.time.fixedTotal, 12);
      assert.equal(actions[0].progress, 1);
      assert.equal(actions[1].progress, 12 / 15);
      assert.equal(actions[2].progress, 12 / 24);
      assert.equal(state.pendingActions.length, 2);
      assert.equal(entity.actions.sizeFlat, 2);
    });

    test("finishing up", () => {
      state.time.fixedDelta = 12;
      // Simulate SystemManager incrementing fixedTotal
      state.time.fixedTotal += state.time.fixedDelta;
      system.update(state);
      assert.equal(state.time.fixedTotal, 24);
      assert.equal(actions[0].progress, 1);
      assert.equal(actions[1].progress, 1);
      assert.equal(actions[2].progress, 1);
      assert.equal(state.pendingActions.length, 0);
      assert.equal(entity.actions.sizeFlat, 0);
    });
  });
});
