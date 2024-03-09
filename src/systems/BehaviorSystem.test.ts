import test from "node:test";
// import assert from "node:assert";
import { Behavior, BehaviorSystem } from "./BehaviorSystem";
import { BehaviorComponent, IsActiveTag } from "../components";
import { MockState } from "../testHelpers";
import { EntityWithComponents } from "../Component";
import { Action } from "./ActionSystem";

const behaviorSystem = new BehaviorSystem();

type IEntity = EntityWithComponents<typeof BehaviorComponent>;

class PlayerBehavior extends Behavior<IEntity, MockState> {
  act(entity: IEntity, context: MockState) {
    void context;
    void entity;
  }
  react(
    action: Action<IEntity, MockState>,
    entity: IEntity,
    context: MockState
  ) {
    void action;
    void context;
    void entity;
  }
}

// class EnemyBehavior extends Behavior<IEntity, MockState> {
//   act(entity: IEntity, context: MockState) {
//     void context;
//     void entity;
//     return [];
//   }
//   react(
//     actions: Action<IEntity, MockState>[],
//     entity: IEntity,
//     context: MockState
//   ) {
//     void context;
//     void entity;
//     return actions;
//   }
// }

test.afterEach(() => {
  BehaviorComponent.clear();
});

test("generating actions", () => {
  const state = new MockState();
  const playerEntity = {};

  BehaviorComponent.add(playerEntity, { behaviorId: "behavior/player" });

  state.addBehavior(playerEntity.behaviorId, new PlayerBehavior());

  state.addQueryResult([BehaviorComponent, IsActiveTag], playerEntity);

  behaviorSystem.start(state as any);
  behaviorSystem.update(state as any);
});

test("reacting to actions", () => {});

// import { BehaviorSystemOld } from "./BehaviorSystem";
// import { stateOld } from "../state";
// import { BehaviorComponent } from "../components";

// test("BehaviorSystem", () => {
//   const entityIds = [
//     stateOld.addEntity(),
//     stateOld.addEntity(),
//     stateOld.addEntity()
//   ];
//   const behaviors = entityIds.map((entityId) => {
//     const behavior = {
//       type: 0,
//       entityId,
//       isStarted: false,
//       start() {
//         this.isStarted = true;
//       },
//       stop() {
//         this.isStarted = false;
//       },
//       onFrame: test.mock.fn(),
//       serialize() {
//         return "serialized behavior";
//       }
//     };
//     return behavior;
//   });

//   // start behaviors of entities that have ActLike components
//   stateOld.set(BehaviorComponent, entityIds[0], behaviors[0]);

//   BehaviorSystemOld(0, 0);

//   assert.strictEqual(behaviors[0].isStarted, true);

//   // calls onFrame of started behaviors
//   assert.strictEqual(behaviors[0].onFrame.mock.calls.length, 1);

//   // doesn't call onFrame of stopped behaviors
//   assert.strictEqual(behaviors[1].onFrame.mock.calls.length, 0);
//   assert.strictEqual(behaviors[2].onFrame.mock.calls.length, 0);

//   // stops behaviors of entities that will be removed
//   // mutState.removeEntity(entityIds[0]);
//   stateOld.setToBeRemovedThisFrame(entityIds[0]);

//   BehaviorSystemOld(0, 0);

//   assert.strictEqual(behaviors[0].isStarted, false);
// });
