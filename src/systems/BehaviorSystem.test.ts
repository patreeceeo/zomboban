import test from "node:test";
import assert from "node:assert";
import { BehaviorSystem } from "./BehaviorSystem";
import { addEntity, removeEntity } from "../Entity";
import { setActLike } from "../components/ActLike";

test("BehaviorSystem", () => {
  const entityIds = [addEntity(), addEntity(), addEntity()];
  const behaviors = entityIds.map((entityId) => {
    const behavior = {
      type: 0,
      entityId,
      isStarted: false,
      start() {
        this.isStarted = true;
      },
      stop() {
        this.isStarted = false;
      },
      onFrame: test.mock.fn(),
    };
    return behavior;
  });

  // start behaviors of entities that have ActLike components
  setActLike(entityIds[0], behaviors[0]);

  BehaviorSystem(0, 0);

  assert.strictEqual(behaviors[0].isStarted, true);

  // calls onFrame of started behaviors
  assert.strictEqual(behaviors[0].onFrame.mock.calls.length, 1);

  // doesn't call onFrame of stopped behaviors
  assert.strictEqual(behaviors[1].onFrame.mock.calls.length, 0);
  assert.strictEqual(behaviors[2].onFrame.mock.calls.length, 0);

  // stops behaviors of entities that have been removed
  removeEntity(entityIds[0]);

  BehaviorSystem(0, 0);

  assert.strictEqual(behaviors[0].isStarted, false);
});
