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
import { ActionDriver } from "./ActionSystem";

class MockBehavior extends Behavior<
  EntityWithComponents<typeof BehaviorComponent>,
  InputState
> {
  #actions = [] as MockAction[];
  constructor(effectedAreas: Vector2[] = []) {
    super();
    this.#actions = effectedAreas.map((area) => {
      const a = new MockAction(0);
      a.effectedArea.push(area);
      return a;
    });
  }
  mapInput(
    _entity: EntityWithComponents<typeof BehaviorComponent>,
    state: InputState
  ) {
    if (state.inputPressed > 0) {
      return this.#actions;
    }
  }
  react = test.mock.fn((drivers: ActionDriver<any, any>[], __) => {
    const returnedActions = [];
    for (const driver of drivers) {
      if (driver.action instanceof MockAction && driver.action.order === 0) {
        const newAction = new MockAction(0);
        newAction.effectedArea = [...driver.action.effectedArea];
        newAction.order = driver.action.order + 1;
        newAction.cause = driver.action;
        returnedActions.push(newAction);
      }
    }
    return returnedActions;
  });
}

const system = new BehaviorSystem();

test.afterEach(() => {
  BehaviorComponent.clear();
  InputReceiverTag.clear();
  IsActiveTag.clear();
  SpriteComponent2.clear();
});

test("mapping input to actions w/ behaviors", () => {
  const entityA = {};
  const entityB = {};
  const state = new MockState();
  const behavior = new MockBehavior([new Vector2(2, 3)]);

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
  const { pendingActions } = state;
  const behavior = new MockBehavior([
    new Vector2(2, 3),
    new Vector2(2, 3),
    new Vector2(100, 100)
  ]);

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

  assert.equal(getMock(behavior.react).callCount(), 1);
  const expectedActions = [
    pendingActions[0],
    pendingActions[1],
    pendingActions[3],
    pendingActions[4]
  ];
  assert.deepEqual(
    getMock(behavior.react).calls[0].arguments[0],
    expectedActions
  );
  assert.deepEqual(getMock(behavior.react).calls[0].arguments[1], entityB);
  assert.equal(entityA.actions.size, 3);
  // assert.equal(entityB.actions.size, 3); // TODO
  for (const action of pendingActions) {
    assert(
      entityA.actions.has(action.action) || entityB.actions.has(action.action)
    );
  }

  // TODO test chaining

  // TODO test multliple updates
});
