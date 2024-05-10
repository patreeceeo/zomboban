import test from "node:test";
import {
  BehaviorSystem,
  Behavior,
  ACTION_CHAIN_LENGTH_MAX
} from "./BehaviorSystem";
import { EntityWithComponents } from "../Component";
import {
  AddedTag,
  BehaviorComponent,
  IsActiveTag,
  TransformComponent
} from "../components";
import { InputState } from "../state";
import { MockAction, MockState, getMock } from "../testHelpers";
import { KeyCombo } from "../Input";
import assert from "node:assert";
import { Vector2 } from "three";
import { IObservableSet } from "../Observable";
import { SystemManager } from "../System";
import { Action, ActionEntity } from "./ActionSystem";
import { convertToPixels } from "../units/convert";

class MockBehavior extends Behavior<
  EntityWithComponents<typeof BehaviorComponent>,
  InputState
> {
  constructor(
    readonly effectedAreas: Vector2[] = [],
    readonly maxChainLength = 0
  ) {
    super();
  }
  onUpdate(
    entity: EntityWithComponents<typeof BehaviorComponent>,
    state: InputState
  ) {
    if (state.inputPressed > 0) {
      return this.effectedAreas.map((area) => {
        const a = new MockAction(entity, 0);
        a.effectedArea.push(area);
        return a;
      });
    }
  }
  onReceive = test.mock.fn(
    (actions: Action<any, any>[], entity: ActionEntity<any>) => {
      const returnedActions = [];
      for (const action of actions) {
        if (
          action instanceof MockAction &&
          action.order < this.maxChainLength
        ) {
          const newAction = new MockAction(entity, 0);
          newAction.effectedArea = [...action.effectedArea];
          newAction.order = action.order + 1;
          newAction.causes.add(action);
          returnedActions.push(newAction);
        }
      }
      return returnedActions;
    }
  );
}

test.afterEach(() => {
  BehaviorComponent.clear();
  (BehaviorComponent.entities as IObservableSet<any>).unobserve();
  IsActiveTag.clear();
  (IsActiveTag.entities as IObservableSet<any>).unobserve();
  TransformComponent.clear();
  (TransformComponent.entities as IObservableSet<any>).unobserve();
  AddedTag.clear();
});

test("mapping input to actions w/ behaviors", () => {
  const entityA = {};
  const entityB = {};
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new BehaviorSystem(mgr);
  const effectedTile = new Vector2(
    convertToPixels(2 as Tile),
    convertToPixels(3 as Tile)
  );
  const behavior = new MockBehavior([effectedTile]);

  BehaviorComponent.add(entityA, { behaviorId: "behavior/mock" });
  BehaviorComponent.add(entityB, { behaviorId: "behavior/mock" });
  IsActiveTag.add(entityA);
  IsActiveTag.add(entityB);
  AddedTag.add(entityA);
  AddedTag.add(entityB);
  state.addBehavior(entityA.behaviorId, behavior);

  state.inputPressed = 1 as KeyCombo;
  system.start(state);
  system.update(state);

  assert.equal(state.pendingActions.length, 2);
});

test("chaining 1 action from 1 behavior", () => {
  const entityA = {};
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new BehaviorSystem(mgr);
  const { pendingActions } = state;
  const effectedTile = new Vector2(
    convertToPixels(2 as Tile),
    convertToPixels(3 as Tile)
  );
  const behavior = new MockBehavior([effectedTile], 1);

  state.addBehavior("behavior/mock", behavior);
  BehaviorComponent.add(entityA, { behaviorId: "behavior/mock" });
  IsActiveTag.add(entityA);
  TransformComponent.add(entityA);
  AddedTag.add(entityA);

  state.tiles.set(2, 3, [entityA]);
  state.inputPressed = 1 as KeyCombo;
  system.start(state);
  system.update(state);

  assert.equal(getMock(behavior.onReceive).callCount(), 2);
  assert.deepEqual(getMock(behavior.onReceive).calls[0].arguments[0], [
    pendingActions[0]
  ]);
  assert.deepEqual(getMock(behavior.onReceive).calls[1].arguments[0], [
    pendingActions[1]
  ]);
  assert.deepEqual(getMock(behavior.onReceive).calls[0].arguments[1], entityA);
  assert.deepEqual(getMock(behavior.onReceive).calls[1].arguments[1], entityA);
  assert.equal(entityA.actions.size, 2);
  for (const action of pendingActions) {
    assert(entityA.actions.has(action));
  }
});

test("directing actions to the appropriate entities based on their effected area", () => {
  const entityA = {};
  const entityB = {};
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new BehaviorSystem(mgr);
  const { pendingActions } = state;
  const overlapTile = new Vector2(
    convertToPixels(2 as Tile),
    convertToPixels(3 as Tile)
  );
  const behaviorA = new MockBehavior([overlapTile, new Vector2(-23, 55)]);
  const behaviorB = new MockBehavior([new Vector2(33, -108), overlapTile]);

  state.addBehavior("behavior/mockA", behaviorA);
  state.addBehavior("behavior/mockB", behaviorB);
  BehaviorComponent.add(entityA, { behaviorId: "behavior/mockA" });
  BehaviorComponent.add(entityB, { behaviorId: "behavior/mockB" });
  IsActiveTag.add(entityA);
  IsActiveTag.add(entityB);
  TransformComponent.add(entityA);
  TransformComponent.add(entityB);
  AddedTag.add(entityA);
  AddedTag.add(entityB);

  state.tiles.set(3, 2, [entityA]);
  state.tiles.set(2, 3, [entityB]);

  state.inputPressed = 1 as KeyCombo;
  system.start(state);
  system.update(state);

  assert.equal(getMock(behaviorB.onReceive).callCount(), 1);
  assert.deepEqual(getMock(behaviorB.onReceive).calls[0].arguments[0], [
    pendingActions[0],
    pendingActions[3]
  ]);
  assert.deepEqual(getMock(behaviorB.onReceive).calls[0].arguments[1], entityB);
  assert.equal(entityA.actions.size, 2);
  assert.equal(entityB.actions.size, 2);
  for (const action of pendingActions) {
    assert(entityA.actions.has(action) || entityB.actions.has(action));
  }
});

test("chain length limit", () => {
  const entityA = {};
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new BehaviorSystem(mgr);
  const effectedTile = new Vector2(
    convertToPixels(2 as Tile),
    convertToPixels(3 as Tile)
  );

  class MockBehavior extends Behavior<
    EntityWithComponents<typeof BehaviorComponent>,
    InputState
  > {
    onUpdate(entity: EntityWithComponents<typeof BehaviorComponent>) {
      const a = new MockAction(entity, 0);
      a.effectedArea.push(effectedTile);
      return [a];
    }
    onReceive = test.mock.fn(
      (actions: Action<any, any>[], entity: ActionEntity<any>) => {
        const returnedActions = [];
        for (const action of actions) {
          if (
            action instanceof MockAction &&
            action.order < ACTION_CHAIN_LENGTH_MAX * 2
          ) {
            const newAction = new MockAction(entity, 0);
            newAction.effectedArea = [...action.effectedArea];
            newAction.order = action.order + 1;
            newAction.causes.add(action);
            returnedActions.push(newAction);
          }
        }
        return returnedActions;
      }
    );
  }
  const behavior = new MockBehavior();
  state.addBehavior("behavior/mock", behavior);
  BehaviorComponent.add(entityA, { behaviorId: "behavior/mock" });
  IsActiveTag.add(entityA);
  TransformComponent.add(entityA);
  AddedTag.add(entityA);

  state.tiles.set(2, 3, [entityA]);
  system.start(state);
  system.update(state);

  assert.equal(
    getMock(behavior.onReceive).callCount(),
    ACTION_CHAIN_LENGTH_MAX
  );
});

// test("reacting to actions w/ behaviors", () => {
//   const entityA = {};
//   const entityB = {};
//   const state = new MockState();
//   const { pendingActions } = state;
//   const behavior = new MockBehavior(
//     [new Vector2(2, 3), new Vector2(2, 3), new Vector2(100, 100)],
//     1
//   );

//   BehaviorComponent.add(entityA, { behaviorId: "behavior/mock" });
//   BehaviorComponent.add(entityB, { behaviorId: "behavior/mock" });
//   IsActiveTag.add(entityA);
//   IsActiveTag.add(entityB);
//   SpriteComponent2.add(entityA);
//   SpriteComponent2.add(entityB);
//   state.addBehavior(entityA.behaviorId, behavior);

//   state.tiles.set(3, 2, [entityA]);
//   state.tiles.set(2, 3, [entityB]);

//   state.inputPressed = 1 as KeyCombo;
//   system.start(state);
//   system.update(state);

//   assert.equal(getMock(behavior.chain).callCount(), 2);
//   assert.deepEqual(getMock(behavior.chain).calls[0].arguments[0], [
//     pendingActions[0],
//     pendingActions[1],
//     pendingActions[3],
//     pendingActions[4]
//   ]);

//   assert.deepEqual(getMock(behavior.chain).calls[1].arguments[0], [
//     pendingActions[6],
//     pendingActions[7],
//     pendingActions[8],
//     pendingActions[9]
//   ]);
//   assert.deepEqual(getMock(behavior.chain).calls[0].arguments[1], entityB);
//   assert.deepEqual(getMock(behavior.chain).calls[1].arguments[1], entityB);
//   assert.equal(entityA.actions.size, 3);
//   // assert.equal(entityB.actions.size, 3); TODO
//   for (const action of pendingActions) {
//     assert(
//       entityA.actions.has(action.action) || entityB.actions.has(action.action)
//     );
//   }
// });
