import test from "node:test";
import { BehaviorSystem, Behavior } from "./BehaviorSystem";
import { EntityWithComponents } from "../Component";
import {
  BehaviorComponent,
  InputReceiverTag,
  IsActiveTag,
  SpriteComponent2
} from "../components";
import { InputState } from "../state";
import { MockAction, MockState, getMock } from "../testHelpers";
import { KeyCombo } from "../Input";
import assert from "node:assert";
import { Vector2 } from "three";

class MockBehavior extends Behavior<
  EntityWithComponents<typeof BehaviorComponent>,
  InputState
> {
  mapInput(
    _entity: EntityWithComponents<typeof BehaviorComponent>,
    state: InputState
  ) {
    if (state.inputPressed > 0) {
      const action = new MockAction(0);
      action.effectedArea.push(new Vector2(2, 3));
      return [action];
    }
  }
  react = test.mock.fn((_, __) => {});
}

const system = new BehaviorSystem();

test.afterEach(() => {
  BehaviorComponent.clear();
  InputReceiverTag.clear();
  IsActiveTag.clear();
});

test("mapping input to actions w/ behaviors", () => {
  const entityA = {};
  const entityB = {};
  const state = new MockState();
  const behavior = new MockBehavior();

  BehaviorComponent.add(entityA, { behaviorId: "behavior/mock" });
  BehaviorComponent.add(entityB, { behaviorId: "behavior/mock" });
  InputReceiverTag.add(entityA);
  InputReceiverTag.add(entityB);
  IsActiveTag.add(entityA);
  IsActiveTag.add(entityB);
  state.addBehavior(entityA.behaviorId, behavior);

  state.inputPressed = 1 as KeyCombo;
  system.start(state);
  system.update(state);

  assert.equal(state.pendingActions.length, 2);
});

test("reacting to actions w/ behaviors", () => {
  const entityA = {};
  const entityB = {};
  const state = new MockState();
  const behavior = new MockBehavior();

  BehaviorComponent.add(entityA, { behaviorId: "behavior/mock" });
  BehaviorComponent.add(entityB, { behaviorId: "behavior/mock" });
  InputReceiverTag.add(entityA);
  InputReceiverTag.add(entityB);
  IsActiveTag.add(entityA);
  IsActiveTag.add(entityB);
  SpriteComponent2.add(entityA);
  SpriteComponent2.add(entityB);
  state.addBehavior(entityA.behaviorId, behavior);

  state.tiles.set(3, 2, [entityA]);
  state.tiles.set(2, 3, [entityB]);

  state.inputPressed = 1 as KeyCombo;
  system.start(state);
  system.update(state);

  assert.equal(getMock(behavior.react).callCount(), 2);
  assert.deepEqual(
    getMock(behavior.react).calls[0].arguments[0],
    state.pendingActions
  );
  assert.deepEqual(
    getMock(behavior.react).calls[1].arguments[0],
    state.pendingActions
  );
  assert.deepEqual(getMock(behavior.react).calls[0].arguments[1], entityB);
  assert.deepEqual(getMock(behavior.react).calls[1].arguments[1], entityB);
  assert.equal(entityA.actions.size, 1);
  assert.equal(entityB.actions.size, 1);
  assert(entityA.actions.has(state.pendingActions[0].action));
  assert(entityB.actions.has(state.pendingActions[1].action));
});
