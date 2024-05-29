import test from "node:test";
import { BehaviorSystem, Behavior } from "./BehaviorSystem";
import { EntityWithComponents } from "../Component";
import {
  AddedTag,
  BehaviorComponent,
  IsActiveTag,
  TransformComponent
} from "../components";
import { MockState } from "../testHelpers";
import assert from "node:assert";
import { IObservableSet } from "../Observable";
import { SystemManager } from "../System";
import { Action } from "./ActionSystem";
import { convertToPixels } from "../units/convert";

class MockAction extends Action<any, any> {
  constructor(entity: any, startTime: number, maxElapsedTime: number) {
    super(entity, startTime, maxElapsedTime);
  }
  seek = test.mock.fn(super.seek);
  update = test.mock.fn((_context: any) => {});
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

test("behaviors initiating actions", () => {
  class MockBehavior extends Behavior<
    EntityWithComponents<typeof BehaviorComponent>,
    never
  > {
    onUpdate(entity: EntityWithComponents<typeof BehaviorComponent>) {
      return [new MockAction(entity, 0, 0), new MockAction(entity, 0, 0)];
    }
  }
  const entityA = {};
  const entityB = {};
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new BehaviorSystem(mgr);
  const behavior = new MockBehavior();

  BehaviorComponent.add(entityA, { behaviorId: "behavior/mock" });
  BehaviorComponent.add(entityB, { behaviorId: "behavior/mock" });
  IsActiveTag.add(entityA);
  IsActiveTag.add(entityB);
  AddedTag.add(entityA);
  AddedTag.add(entityB);
  state.addBehavior(entityA.behaviorId, behavior);

  system.start(state);
  system.update(state);

  assert.equal(state.pendingActions.length, 4);
});

test("behaviors receiving and reacting to actions", () => {
  class MockBehavior extends Behavior<
    EntityWithComponents<typeof BehaviorComponent>,
    never
  > {
    onUpdate(entity: EntityWithComponents<typeof BehaviorComponent>) {
      const action = new MockAction(entity, 0, 0);
      action.addEffectedTile(
        convertToPixels(2 as Tile),
        convertToPixels(3 as Tile)
      );
      return [action];
    }
  }
  class MockBehavior2 extends Behavior<
    EntityWithComponents<typeof BehaviorComponent>,
    never
  > {
    onReceive(
      actions: readonly Action<
        EntityWithComponents<typeof BehaviorComponent>,
        any
      >[]
    ) {
      return actions.map(
        (action) =>
          new MockAction(action.entity, action.startTime, action.maxElapsedTime)
      );
    }
  }
  const entityA = {};
  const entityB = {};
  const state = new MockState();
  const mgr = new SystemManager(state);
  const system = new BehaviorSystem(mgr);
  const { pendingActions } = state;
  const behavior = new MockBehavior();
  const behavior2 = new MockBehavior2();

  state.addBehavior("behavior/mock", behavior);
  state.addBehavior("behavior/mock2", behavior2);
  BehaviorComponent.add(entityA, { behaviorId: "behavior/mock" });
  BehaviorComponent.add(entityB, { behaviorId: "behavior/mock2" });
  IsActiveTag.add(entityA);
  IsActiveTag.add(entityB);
  TransformComponent.add(entityA);
  TransformComponent.add(entityB);
  AddedTag.add(entityA);
  AddedTag.add(entityB);

  state.tiles.set(2, 3, [entityB]);
  system.start(state);
  system.update(state);

  assert.equal(pendingActions.length, 2);
});
