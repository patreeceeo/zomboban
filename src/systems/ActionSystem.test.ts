import test from "node:test";
import { ActionDriver, ActionSystem } from "./ActionSystem";
import { BehaviorComponent } from "../components";
import { MockAction, MockState, getMock } from "../testHelpers";
import assert from "node:assert";

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
  assert.equal(entity.actions.size, 0);
});
