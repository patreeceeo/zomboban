import test from "node:test";
import assert from "node:assert";
import { addEntity } from "../Entity";
import { removeActLike, setActLike } from "./ActLike";

test("components/ActLike", () => {
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

  // stops behaviors of entities that have had their ActLike components removed
  setActLike(entityIds[1], behaviors[1]);

  behaviors[1].isStarted = true;

  removeActLike(entityIds[1]);

  assert.strictEqual(behaviors[1].isStarted, false);

  // stops behaviors of entities that have had their behaviors changed
  setActLike(entityIds[1], behaviors[1]);

  behaviors[1].isStarted = true;

  setActLike(entityIds[1], behaviors[2]);

  assert.strictEqual(behaviors[1].isStarted, false);
});
