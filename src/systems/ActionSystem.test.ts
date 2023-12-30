import test from "node:test";
import assert from "node:assert";
import {
  ActionSystem,
  Action,
  addAction,
  hasQueuedActions,
} from "./ActionSystem";

class TestAction implements Action {
  progress = test.mock.fn((_deltaTime: number) => {});
  undo = test.mock.fn(() => {});
  isComplete = false;
}

test("ActionSystem", () => {
  const action = new TestAction();
  assert(!hasQueuedActions());
  addAction(action);
  assert(hasQueuedActions());
  ActionSystem(12);
  assert(action.progress.mock.calls.length === 1);
  assert(action.undo.mock.calls.length === 0);
  assert(!hasQueuedActions());
  assert.deepEqual(action.progress.mock.calls[0].arguments, [12]);
  action.isComplete = true;
  ActionSystem(23);
  assert.equal(action.progress.mock.calls.length, 2);
  assert.equal(action.undo.mock.calls.length, 0);
  assert.deepEqual(action.progress.mock.calls[1].arguments, [23]);
  ActionSystem(34);
  assert.equal(action.progress.mock.calls.length, 2);
  assert.equal(action.undo.mock.calls.length, 0);
});
