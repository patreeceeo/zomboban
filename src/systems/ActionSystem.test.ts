import test from "node:test";
import { ActionDriver, ActionSystem } from "./ActionSystem";
import { BehaviorComponent, PendingActionTag } from "../components";
import { MockAction, MockState, getMock } from "../testHelpers";
import assert from "node:assert";
import { SystemManager } from "../System";

test("processing pending actions", () => {
  const entity = {};
  const state = new MockState();
  const mgr = new SystemManager(state);

  BehaviorComponent.add(entity, { behaviorId: "behavior/mock" });

  const actionDrivers = [new MockAction(22), new MockAction(33)].map(
    (action) => new ActionDriver(action, entity)
  );
  const system = new ActionSystem(mgr);

  state.pendingActions.push(...actionDrivers);

  const previousPendingActions = state.pendingActions;

  system.update(state);
  assert.equal(state.pendingActions.length, 2);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actionDrivers[0].action.stepForward).callCount(), 1);
  assert.equal(getMock(actionDrivers[1].action.stepForward).callCount(), 1);
  assert(PendingActionTag.has(entity));

  state.dt = 22;
  system.update(state);
  assert.equal(state.pendingActions.length, 2);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actionDrivers[0].action.stepForward).callCount(), 2);
  assert.equal(getMock(actionDrivers[1].action.stepForward).callCount(), 2);
  assert(PendingActionTag.has(entity));

  state.dt = 33;
  system.update(state);
  assert.equal(state.pendingActions.length, 0);
  assert.equal(state.completedActions.length, 1);
  assert.equal(getMock(actionDrivers[0].action.stepForward).callCount(), 3);
  assert.equal(getMock(actionDrivers[1].action.stepForward).callCount(), 3);
  assert.equal(entity.actions.size, 0);
  assert(!PendingActionTag.has(entity));

  assert.notEqual(state.pendingActions, previousPendingActions);
});

test("undoing completed actions", () => {
  const entity = {};
  const state = new MockState();
  const mgr = new SystemManager(state);

  BehaviorComponent.add(entity, { behaviorId: "behavior/mock" });

  const actionDrivers = [new MockAction(22, 22), new MockAction(33, 33)].map(
    (action) => {
      action.progress = 1;
      return new ActionDriver(action, entity);
    }
  );
  const system = new ActionSystem(mgr);

  const previousCompletedActions = state.completedActions;

  state.undo = true;
  state.completedActions.push(actionDrivers);

  system.update(state);
  assert.equal(state.pendingActions.length, 2);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actionDrivers[0].action.stepBackward).callCount(), 1);
  assert.equal(getMock(actionDrivers[1].action.stepBackward).callCount(), 1);
  assert.equal(entity.actions.size, 2);
  assert(PendingActionTag.has(entity));

  state.dt = 22;
  system.update(state);
  assert.equal(state.pendingActions.length, 2);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actionDrivers[0].action.stepBackward).callCount(), 2);
  assert.equal(getMock(actionDrivers[1].action.stepBackward).callCount(), 2);
  assert.equal(entity.actions.size, 2);
  assert(PendingActionTag.has(entity));

  state.dt = 33;
  system.update(state);
  assert.equal(state.pendingActions.length, 0);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actionDrivers[0].action.stepBackward).callCount(), 3);
  assert.equal(getMock(actionDrivers[1].action.stepBackward).callCount(), 3);
  assert.equal(entity.actions.size, 0);
  assert(!PendingActionTag.has(entity));
  assert(!state.undo);
  assert.notEqual(state.pendingActions, previousCompletedActions);
});

test("filtering out directly and indirectly cancelled actions", () => {
  const player = {};
  const block1 = {};
  const block2 = {};
  const state = new MockState();
  const mgr = new SystemManager(state);
  const { pendingActions, completedActions } = state;

  BehaviorComponent.add(player, { behaviorId: "behavior/mock" });
  BehaviorComponent.add(block1, { behaviorId: "behavior/mock" });
  BehaviorComponent.add(block2, { behaviorId: "behavior/mock" });

  const actionDrivers = [
    new ActionDriver(new MockAction(1), player),
    new ActionDriver(new MockAction(1), block1),
    new ActionDriver(new MockAction(1), block2)
  ];
  const system = new ActionSystem(mgr);

  pendingActions.push(...actionDrivers);

  pendingActions[0].action.chain(pendingActions[1].action);
  pendingActions[1].action.chain(pendingActions[2].action);
  pendingActions[2].action.cancelled = true;

  assert.equal(player.actions.size, 1);
  assert.equal(block1.actions.size, 1);
  assert.equal(block2.actions.size, 1);
  system.update(state);
  assert.equal(pendingActions.length, 0);
  assert.equal(completedActions.length, 0);
  assert.equal(getMock(actionDrivers[0].action.stepForward).callCount(), 0);
  assert.equal(getMock(actionDrivers[1].action.stepForward).callCount(), 0);
  assert.equal(getMock(actionDrivers[2].action.stepForward).callCount(), 0);
  assert.equal(player.actions.size, 0);
  assert.equal(block1.actions.size, 0);
  assert.equal(block2.actions.size, 0);
});
