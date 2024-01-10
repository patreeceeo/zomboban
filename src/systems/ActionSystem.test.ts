import test from "node:test";
import assert from "node:assert";
import {
  ActionSystem,
  Action,
  enqueueAction,
  hasQueuedActions,
} from "./ActionSystem";
import { Rectangle } from "../Rectangle";

class TestAction implements Action {
  entityId = 0;
  effectedArea = new Rectangle(0, 0, 0, 0);
  progress = test.mock.fn((_deltaTime: number) => {});
  complete = test.mock.fn(() => {});
  undo = test.mock.fn(() => {});
  isComplete = false;
}

test("ActionSystem", () => {
  const action = new TestAction();
  assert(!hasQueuedActions(0));
  enqueueAction(action);
  assert(hasQueuedActions(0));
  ActionSystem(12, 12);
  assert(action.progress.mock.calls.length === 1);
  assert(action.undo.mock.calls.length === 0);
  assert(!hasQueuedActions(0));
  assert.deepEqual(action.progress.mock.calls[0].arguments, [12, 12]);
  action.isComplete = true;
  ActionSystem(23, 11);
  assert.equal(action.progress.mock.calls.length, 2);
  assert.equal(action.undo.mock.calls.length, 0);
  assert.deepEqual(action.progress.mock.calls[1].arguments, [23, 11]);
  ActionSystem(34, 11);
  assert.equal(action.progress.mock.calls.length, 2);
  assert.equal(action.undo.mock.calls.length, 0);
});
