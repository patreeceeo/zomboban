import test from "node:test";
import { Action, ActionSystem } from "./ActionSystem";
import { BehaviorComponent, ChangedTag } from "../components";
import { MockState, getMock } from "../testHelpers";
import assert from "node:assert";
import { SystemManager } from "../System";
import { World } from "../EntityManager";

class MockAction extends Action<any, any> {
  constructor(entity: any, startTime: number, maxElapsedTime: number) {
    super(entity, startTime, maxElapsedTime);
  }
  seek = test.mock.fn(super.seek);
  update = test.mock.fn((_context: any) => {});
}

test("processing pending actions", () => {
  const world = new World();
  const entity = world.addEntity();
  const state = new MockState();
  const mgr = new SystemManager(state);

  BehaviorComponent.add(entity, { behaviorId: "behavior/mock" });

  const actions = [
    new MockAction(entity, 0, 22),
    new MockAction(entity, 0, 33)
  ];
  const system = new ActionSystem(mgr);

  state.pendingActions.push(...actions);

  system.update(state);
  assert.equal(state.pendingActions.length, 2);
  assert.equal(state.completedActions.length, 0);
  assert.equal(getMock(actions[0].seek).callCount(), 1);
  assert.equal(getMock(actions[1].seek).callCount(), 1);
  assert.equal(getMock(actions[0].update).callCount(), 1);
  assert.equal(getMock(actions[1].update).callCount(), 1);

  state.dt = 22;
  system.update(state);
  assert.equal(state.pendingActions.length, 1);
  assert.equal(state.completedActions.length, 1);
  assert.equal(getMock(actions[0].seek).callCount(), 2);
  assert.equal(getMock(actions[1].seek).callCount(), 2);
  assert.equal(getMock(actions[0].update).callCount(), 2);
  assert.equal(getMock(actions[1].update).callCount(), 2);

  state.dt = 33;
  system.update(state);
  assert.equal(state.pendingActions.length, 0);
  assert.equal(state.completedActions.length, 2);
  assert.equal(getMock(actions[0].seek).callCount(), 2);
  assert.equal(getMock(actions[1].seek).callCount(), 3);
  assert.equal(getMock(actions[0].update).callCount(), 2);
  assert.equal(getMock(actions[1].update).callCount(), 3);
  assert.equal(entity.actions.size, 0);
  assert(ChangedTag.has(entity));
});

test("undoing completed actions", () => {
  const world = new World();
  const entity = world.addEntity();
  const state = new MockState();
  const mgr = new SystemManager(state);
  const { undoingActions, completedActions, pendingActions } = state;

  BehaviorComponent.add(entity, { behaviorId: "behavior/mock" });

  const system = new ActionSystem(mgr);

  state.time = 38;
  state.undoUntilTime = 0;
  state.undoRequested = true;

  // add some completed actions
  const actions = [
    new MockAction(entity, 6, 12),
    new MockAction(entity, 12, 12),
    new MockAction(entity, 18, 12)
  ];
  pendingActions.push(...actions);

  // Give it enough time to process the pending actions and switch to undoing
  state.dt = 30;
  system.update(state);

  for (const action of actions) {
    getMock(action.update).resetCalls();
  }

  // Always starts undoing at least 1 action, skipping over empty time segments
  state.dt = 4;
  system.update(state);
  assert.equal(pendingActions.length, 0);
  assert.equal(undoingActions.length, 1);
  assert.equal(completedActions.length, 2);
  assert.equal(getMock(actions[2].update).callCount(), 1);
  assert.equal(getMock(actions[1].update).callCount(), 0);
  assert.equal(getMock(actions[0].update).callCount(), 0);
  assert.equal(entity.actions.size, 1);
  assert.equal(state.time, 28);

  // Can undo multiple actions at once
  state.dt = 6;
  system.update(state);
  assert.equal(pendingActions.length, 0);
  assert.equal(undoingActions.length, 2);
  assert.equal(completedActions.length, 1);
  assert.equal(getMock(actions[2].update).callCount(), 2);
  assert.equal(getMock(actions[1].update).callCount(), 1);
  assert.equal(getMock(actions[0].update).callCount(), 0);
  assert.equal(entity.actions.size, 2);
  assert.equal(state.time, 22);

  // Finishing
  state.dt = 22;
  system.update(state);
  assert.equal(pendingActions.length, 0);
  assert.equal(undoingActions.length, 0);
  assert.equal(completedActions.length, 0);
  assert.equal(getMock(actions[2].update).callCount(), 3);
  assert.equal(getMock(actions[1].update).callCount(), 2);
  assert.equal(getMock(actions[0].update).callCount(), 1);
  assert.equal(entity.actions.size, 0);
  assert.equal(state.time, 0);
  assert(!state.undoInProgress);
  assert(!state.undoRequested);
});

test("handling directly and indirectly cancelled actions", () => {
  const world = new World();
  const player = world.addEntity();
  const block1 = world.addEntity();
  const block2 = world.addEntity();
  const state = new MockState();
  const mgr = new SystemManager(state);
  const { pendingActions, completedActions } = state;

  BehaviorComponent.add(player, { behaviorId: "behavior/mock" });
  BehaviorComponent.add(block1, { behaviorId: "behavior/mock" });
  BehaviorComponent.add(block2, { behaviorId: "behavior/mock" });

  const actions = [
    new MockAction(player, 0, 1),
    new MockAction(block1, 0, 1),
    new MockAction(block2, 0, 1)
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
  assert.equal(getMock(actions[0].update).callCount(), 0);
  assert.equal(getMock(actions[1].update).callCount(), 0);
  assert.equal(getMock(actions[2].update).callCount(), 0);
  assert.equal(player.actions.size, 0);
  assert.equal(block1.actions.size, 0);
  assert.equal(block2.actions.size, 0);
  assert(player.cancelledActions.has(actions[0]));
  assert(block1.cancelledActions.has(actions[1]));
  assert(block2.cancelledActions.has(actions[2]));
  assert(actions[0].cancelled);
  assert(actions[1].cancelled);
});
