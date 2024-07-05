import test, { describe } from "node:test";
import { ActionSystem, UndoState } from "./ActionSystem";
import { BehaviorComponent, ChangedTag } from "../components";
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

function almostEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.001;
}

describe("ActionSystem", () => {
  describe("processing pending actions", () => {
    const world = new World();
    const entity = world.addEntity();
    const state = new MockState();
    const mgr = new SystemManager(state);

    BehaviorComponent.add(entity, { behaviorId: "behavior/mock" });

    // The system currently assumes that all pending actions should be started immediately
    const actions = [
      new MockAction(entity, 0, 12),
      new MockAction(entity, 0, 15),
      new MockAction(entity, 0, 24)
    ];
    const system = new ActionSystem(mgr);

    system.start(state);

    state.pendingActions.push(...actions);

    test("when dt is zero, nothing happens", () => {
      system.update(state);
      assert.equal(state.time, 0);
      assert.equal(actions[0].progress, 0);
      assert.equal(actions[1].progress, 0);
      assert.equal(state.pendingActions.length, 3);
      assert.equal(state.completedActions.length, 0);
      assert.equal(entity.actions.size, 3);
    });

    test("actions are moved to complete as time passes", () => {
      state.dt = 12;
      system.update(state);
      assert.equal(state.time, 12);
      assert.equal(actions[0].progress, 1);
      assert.equal(actions[1].progress, 12 / 15);
      assert.equal(actions[2].progress, 12 / 24);
      assert.equal(state.pendingActions.length, 2);
      assert.equal(state.completedActions.length, 1);
      assert.equal(entity.actions.size, 2);
      assert(ChangedTag.has(entity));
    });

    test("finishing up", () => {
      state.dt = 12;
      system.update(state);
      assert.equal(state.time, 24);
      assert.equal(actions[0].progress, 1);
      assert.equal(actions[1].progress, 1);
      assert.equal(actions[2].progress, 1);
      assert.equal(state.pendingActions.length, 0);
      assert.equal(state.completedActions.length, 3);
      assert.equal(entity.actions.size, 0);
      assert(ChangedTag.has(entity));
    });
  });

  describe("undoing completed actions", () => {
    const world = new World();
    const entity = world.addEntity();
    const state = new MockState();
    const mgr = new SystemManager(state);
    const { undoingActions, completedActions, pendingActions } = state;

    BehaviorComponent.add(entity, { behaviorId: "behavior/mock" });

    const system = new ActionSystem(mgr);

    state.time = 42;
    Action.nextId = 0;
    state.undoActionId = 2;

    // add some completed actions
    const actions = [
      new MockAction(entity, 6, 12),
      new MockAction(entity, 12, 12),
      new MockAction(entity, 12, 15),
      new MockAction(entity, 18, 12)
    ];

    system.start(state);

    test("doesn't crash if there aren't any pending actions", () => {
      state.undoState = UndoState.FinishPendingActions;
      state.dt = 0;
      system.update(state);
      assert.equal(state.time, 42);
    });

    test("finishes up pending actions before beginning to undo", () => {
      pendingActions.push(...actions);
      state.undoState = UndoState.FinishPendingActions;
      state.dt = 30;
      system.update(state);
      assert.equal(state.time, 72);
      assert.equal(actions[0].progress, 1);
      assert.equal(actions[1].progress, 1);
      assert.equal(actions[2].progress, 1);
      assert.equal(actions[3].progress, 1);
      assert.equal(pendingActions.length, 0);
      assert.equal(undoingActions.length, 4);
      assert.equal(completedActions.length, 0);
      assert.equal(state.undoState, UndoState.Undoing);
    });

    test("when beginning to undo, the appropriate actions are moved from complete to undoing", () => {
      assert.equal(state.pendingActions.length, 0);
      assert.equal(state.completedActions.length, 0);
      assert.equal(state.undoingActions.length, 4);
    });

    test("uses dt to step back through the actions (multiple actions can start at once)", () => {
      state.dt = 46;
      system.update(state);
      console.log("time", state.time);
      assert.equal(actions[0].progress, 1);
      assert.equal(actions[1].progress, 1);
      assert(almostEqual(actions[2].progress, 14 / 15));
      assert(almostEqual(actions[3].progress, 8 / 12));
      assert.equal(pendingActions.length, 0);
      assert.equal(undoingActions.length, 4);
      assert.equal(completedActions.length, 0);
    });

    test("finishing", () => {
      state.dt = 26;
      system.update(state);
      assert.equal(actions[0].progress, 0);
      assert.equal(actions[1].progress, 0);
      assert.equal(actions[2].progress, 0);
      assert.equal(actions[3].progress, 0);
      assert.equal(pendingActions.length, 0);
      assert.equal(undoingActions.length, 0);
      assert.equal(completedActions.length, 0);
    });
  });
});
