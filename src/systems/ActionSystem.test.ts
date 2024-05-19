import test from "node:test";
import { ActionSystem } from "./ActionSystem";
import { BehaviorComponent, ChangedTag } from "../components";
import { MockAction, MockState, getMock } from "../testHelpers";
import assert from "node:assert";
import { SystemManager } from "../System";

test("processing pending actions", () => {
  const entity = {};
  const state = new MockState();
  const mgr = new SystemManager(state);

  BehaviorComponent.add(entity, { behaviorId: "behavior/mock" });

  const actions = [new MockAction(entity, 22), new MockAction(entity, 33)];
  const system = new ActionSystem(mgr);

  state.pendingActions.push(...actions);

  system.update(state);
  assert.equal(state.pendingActions.length, 2);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actions[0].stepForward).callCount(), 1);
  assert.equal(getMock(actions[1].stepForward).callCount(), 1);

  state.dt = 22;
  system.update(state);
  assert.equal(state.pendingActions.length, 1);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actions[0].stepForward).callCount(), 2);
  assert.equal(getMock(actions[1].stepForward).callCount(), 2);

  state.dt = 33;
  system.update(state);
  assert.equal(state.pendingActions.length, 0);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actions[0].stepForward).callCount(), 2);
  assert.equal(getMock(actions[1].stepForward).callCount(), 3);
  assert.equal(entity.actions.size, 0);
  assert(ChangedTag.has(entity));
});

test("undoing completed actions", () => {
  const entity = {};
  const state = new MockState();
  const mgr = new SystemManager(state);

  BehaviorComponent.add(entity, { behaviorId: "behavior/mock" });

  const actions = [
    new MockAction(entity, 22, 22),
    new MockAction(entity, 33, 33)
  ];
  const system = new ActionSystem(mgr);

  state.undo = true;
  state.pendingActions.push(...actions);
  state.completedActions.push(actions);

  state.dt = 0;
  system.update(state);
  assert.equal(state.undoingActions.length, 0);
  assert.equal(state.completedActions.length, 1);
  assert.equal(getMock(actions[0].stepBackward).callCount(), 0);
  assert.equal(getMock(actions[1].stepBackward).callCount(), 0);
  assert.equal(entity.actions.size, 2);

  state.dt = 0;
  state.pendingActions.length = 0;
  state.undo = true;
  system.update(state);
  assert.equal(state.undoingActions.length, 2);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actions[0].stepBackward).callCount(), 1);
  assert.equal(getMock(actions[1].stepBackward).callCount(), 1);
  assert.equal(entity.actions.size, 2);

  state.dt = 22;
  system.update(state);
  assert.equal(state.undoingActions.length, 2);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actions[0].stepBackward).callCount(), 2);
  assert.equal(getMock(actions[1].stepBackward).callCount(), 2);
  assert.equal(entity.actions.size, 2);

  state.dt = 33;
  system.update(state);
  assert.equal(state.undoingActions.length, 0);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actions[0].stepBackward).callCount(), 3);
  assert.equal(getMock(actions[1].stepBackward).callCount(), 3);
  assert.equal(entity.actions.size, 0);
  assert(ChangedTag.has(entity));
  assert(!state.undo);
});

test("handling directly and indirectly cancelled actions", () => {
  const player = {};
  const block1 = {};
  const block2 = {};
  const state = new MockState();
  const mgr = new SystemManager(state);
  const { pendingActions, completedActions } = state;

  BehaviorComponent.add(player, { behaviorId: "behavior/mock" });
  BehaviorComponent.add(block1, { behaviorId: "behavior/mock" });
  BehaviorComponent.add(block2, { behaviorId: "behavior/mock" });

  const actions = [
    new MockAction(player, 1),
    new MockAction(block1, 1),
    new MockAction(block2, 1)
  ];
  const system = new ActionSystem(mgr);

  pendingActions.push(...actions);

  pendingActions.at(1)!.causes.add(pendingActions.at(0)!);
  pendingActions.at(2)!.causes.add(pendingActions.at(1)!);
  pendingActions.at(2)!.cancelled = true;

  assert.equal(player.actions.size, 1);
  assert.equal(block1.actions.size, 1);
  assert.equal(block2.actions.size, 1);
  system.update(state);
  assert.equal(pendingActions.length, 0);
  assert.equal(completedActions.length, 0);
  assert.equal(getMock(actions[0].stepForward).callCount(), 0);
  assert.equal(getMock(actions[1].stepForward).callCount(), 0);
  assert.equal(getMock(actions[2].stepForward).callCount(), 0);
  assert.equal(player.actions.size, 0);
  assert.equal(block1.actions.size, 0);
  assert.equal(block2.actions.size, 0);
  assert(player.cancelledActions.has(actions[0]));
  assert(block1.cancelledActions.has(actions[1]));
  assert(block2.cancelledActions.has(actions[2]));
  assert(actions[0].cancelled);
  assert(actions[1].cancelled);
});
