import test from "node:test";
import assert from "node:assert";
import {
  ActionSystemOld,
  ActionOld,
  enqueueActionOld,
  hasQueuedActionsOld
} from "./ActionSystem";
import { Rectangle } from "../Rectangle";

class TestAction implements ActionOld {
  entityId = 0;
  effectedArea = new Rectangle(0, 0, 0, 0);
  progress = test.mock.fn((_deltaTime: number) => {});
  complete = test.mock.fn(() => {});
  undo = test.mock.fn(() => {});
  isComplete = false;
}

test("ActionSystem", () => {
  const action = new TestAction();
  assert(!hasQueuedActionsOld(0));
  enqueueActionOld(action);
  assert(hasQueuedActionsOld(0));
  ActionSystemOld(12, 12);
  assert(action.progress.mock.calls.length === 1);
  assert(action.undo.mock.calls.length === 0);
  assert(!hasQueuedActionsOld(0));
  assert.deepEqual(action.progress.mock.calls[0].arguments, [12, 12]);
  action.isComplete = true;
  ActionSystemOld(23, 11);
  assert.equal(action.progress.mock.calls.length, 2);
  assert.equal(action.undo.mock.calls.length, 0);
  assert.deepEqual(action.progress.mock.calls[1].arguments, [23, 11]);
  ActionSystemOld(34, 11);
  assert.equal(action.progress.mock.calls.length, 2);
  assert.equal(action.undo.mock.calls.length, 0);
});
