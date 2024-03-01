import test from "node:test";
import assert from "node:assert";
import { BehaviorSystem } from "./BehaviorSystem";
import { stateOld } from "../state";
import { BehaviorComponent } from "../components";

test("BehaviorSystem", () => {
  const entityIds = [
    stateOld.addEntity(),
    stateOld.addEntity(),
    stateOld.addEntity()
  ];
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
      serialize() {
        return "serialized behavior";
      }
    };
    return behavior;
  });

  // start behaviors of entities that have ActLike components
  stateOld.set(BehaviorComponent, entityIds[0], behaviors[0]);

  BehaviorSystem(0, 0);

  assert.strictEqual(behaviors[0].isStarted, true);

  // calls onFrame of started behaviors
  assert.strictEqual(behaviors[0].onFrame.mock.calls.length, 1);

  // doesn't call onFrame of stopped behaviors
  assert.strictEqual(behaviors[1].onFrame.mock.calls.length, 0);
  assert.strictEqual(behaviors[2].onFrame.mock.calls.length, 0);

  // stops behaviors of entities that will be removed
  // mutState.removeEntity(entityIds[0]);
  stateOld.setToBeRemovedThisFrame(entityIds[0]);

  BehaviorSystem(0, 0);

  assert.strictEqual(behaviors[0].isStarted, false);
});
