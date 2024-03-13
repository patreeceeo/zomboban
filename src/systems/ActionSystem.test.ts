import test from "node:test";
import { Action, ActionDriver, ActionSystem } from "./ActionSystem";
import { BehaviorComponent } from "../components";
import { MockState, getMock } from "../testHelpers";
import { TimeState } from "../state";
import { EntityWithComponents } from "../Component";
import assert from "node:assert";

class MockAction extends Action<any, any> {
  #time = 0;
  constructor(readonly maxTime: number) {
    super();
  }
  bind() {
    return;
  }
  stepForward = test.mock.fn(
    (
      _entity: EntityWithComponents<typeof BehaviorComponent>,
      state: TimeState
    ) => {
      this.#time += state.dt;
      if (this.#time >= this.maxTime) {
        this.isComplete = true;
      }
    }
  );
  stepBackward() {
    return;
  }
}

test("processing pending actions", () => {
  const entity = {};
  const state = new MockState();

  BehaviorComponent.add(entity, { behaviorId: "behavior/mock" });

  const actionDrivers = [new MockAction(22), new MockAction(33)].map(
    (action) => new ActionDriver(action, entity)
  );
  const system = new ActionSystem();

  state.pendingActions.push(...actionDrivers);

  system.update(state);
  assert.equal(state.pendingActions.length, 2);
  assert.equal(state.completedActions.size, 0);
  assert.equal(getMock(actionDrivers[0].action.stepForward).callCount(), 1);
  assert.equal(getMock(actionDrivers[1].action.stepForward).callCount(), 1);

  state.dt = 22;
  system.update(state);
  assert.equal(state.pendingActions.length, 2);
  assert.equal(state.completedActions.size, 0);
  assert.equal(getMock(actionDrivers[0].action.stepForward).callCount(), 2);
  assert.equal(getMock(actionDrivers[1].action.stepForward).callCount(), 2);

  state.dt = 33;
  system.update(state);
  assert.equal(state.pendingActions.length, 0);
  assert.equal(state.completedActions.size, 1);
  assert.equal(getMock(actionDrivers[0].action.stepForward).callCount(), 3);
  assert.equal(getMock(actionDrivers[1].action.stepForward).callCount(), 3);
});
