import test, { describe } from "node:test";
import { BehaviorSystem, Behavior, CompositeBehavior } from "./BehaviorSystem";
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
import { World } from "../EntityManager";
import { BehaviorState } from "../state";
import {
  Message,
  TMessageNoAnswer,
  createMessage,
  sendMessage
} from "../Message";
import { Action } from "../Action";

test.afterEach(() => {
  BehaviorComponent.clear();
  (BehaviorComponent.entities as IObservableSet<any>).unobserve();
  IsActiveTag.clear();
  (IsActiveTag.entities as IObservableSet<any>).unobserve();
  TransformComponent.clear();
  (TransformComponent.entities as IObservableSet<any>).unobserve();
  AddedTag.clear();
  (AddedTag.entities as IObservableSet<any>).unobserve();
  Message.nextId = 0;
});

class SendOnEnterBehavior<
  Entity extends EntityWithComponents<typeof BehaviorComponent>
> extends Behavior<Entity, BehaviorState> {
  constructor(
    readonly getMessage: (entity: Entity) => Message<string>,
    readonly expectedAnswer: string
  ) {
    super();
  }
  onEnter(entity: Entity, context: BehaviorState) {
    const answer = sendMessage(this.getMessage(entity), context);
    assert.equal(answer, this.expectedAnswer);
  }
}

class SendOnUpdateBehavior<
  Entity extends EntityWithComponents<typeof BehaviorComponent>
> extends Behavior<Entity, never> {
  constructor(
    readonly getMessage: (entity: Entity) => Message<string>,
    readonly expectedAnswer: string | TMessageNoAnswer
  ) {
    super();
  }
  onUpdateEarly(entity: Entity, context: BehaviorState) {
    const answer = sendMessage(this.getMessage(entity), context);
    assert.equal(answer, this.expectedAnswer);
  }
}

class RespondOnReceiveBehavior<
  Entity extends EntityWithComponents<typeof BehaviorComponent>
> extends Behavior<Entity, never> {
  count = 0;
  constructor(
    readonly answer: string,
    readonly max = Infinity
  ) {
    super();
  }
  onReceive(message: Message<string>) {
    this.count++;
    if (this.count < this.max) {
      message.answer = this.answer;
    }
  }
}

function setUpBehavior<
  Entity extends EntityWithComponents<typeof BehaviorComponent>,
  Context extends BehaviorState
>(
  id: string,
  behavior: Behavior<Entity, Context>,
  entity: Entity,
  state: Context
) {
  state.addBehavior(id, behavior);
  entity.behaviorId = id;
  return behavior;
}

describe("BehaviorSystem", () => {
  test("an actor can send messages to itself", () => {
    const world = new World();
    const entity = world.addEntity();
    const state = new MockState();
    const mgr = new SystemManager(state);
    const system = new BehaviorSystem(mgr);

    BehaviorComponent.add(entity);

    setUpBehavior(
      "behavior/mock",
      new CompositeBehavior([
        new SendOnEnterBehavior(
          () => createMessage(Message).from(entity).to(entity),
          "okay"
        ),
        new RespondOnReceiveBehavior("okay")
      ]),
      entity,
      state
    );

    IsActiveTag.add(entity);
    AddedTag.add(entity);

    system.start(state);
  });

  test("actors can send messages to each other", () => {
    const world = new World();
    const entity1 = world.addEntity();
    const entity2 = world.addEntity();
    const state = new MockState();
    const mgr = new SystemManager(state);
    const system = new BehaviorSystem(mgr);

    BehaviorComponent.add(entity1);
    BehaviorComponent.add(entity2);

    setUpBehavior(
      "behavior/mock1",
      new CompositeBehavior([
        new SendOnUpdateBehavior(
          () => createMessage(Message).from(entity1).to(entity2),
          "okay"
        ),
        new RespondOnReceiveBehavior("okay")
      ]),
      entity1,
      state
    );

    setUpBehavior(
      "behavior/mock2",
      new CompositeBehavior([
        new SendOnUpdateBehavior(
          () => createMessage(Message).from(entity2).to(entity1),
          "okay"
        ),
        new RespondOnReceiveBehavior("okay")
      ]),
      entity2,
      state
    );

    IsActiveTag.add(entity1);
    IsActiveTag.add(entity2);
    AddedTag.add(entity1);
    AddedTag.add(entity2);

    system.start(state);
    system.update(state);
  });

  test("actors get the default answer if the receiver doesn't answer", () => {
    const world = new World();
    const entity1 = world.addEntity();
    const entity2 = world.addEntity();
    const state = new MockState();
    const mgr = new SystemManager(state);
    const system = new BehaviorSystem(mgr);

    BehaviorComponent.add(entity1);
    BehaviorComponent.add(entity2);

    class MyMessage extends Message<string> {
      answer = "idk";
    }

    setUpBehavior(
      "behavior/mock1",
      new CompositeBehavior([
        new SendOnUpdateBehavior(
          () => createMessage(MyMessage).from(entity1).to(entity2),
          "idk"
        )
      ]),
      entity1,
      state
    );

    setUpBehavior("behavior/mock2", new CompositeBehavior([]), entity2, state);

    IsActiveTag.add(entity1);
    IsActiveTag.add(entity2);
    AddedTag.add(entity1);
    AddedTag.add(entity2);

    system.start(state);
    system.update(state);
  });

  test("actors (in/out)boxes contain messages (received/sent) during early frame", () => {
    const world = new World();
    const entity1 = world.addEntity();
    const entity2 = world.addEntity();
    const state = new MockState();
    const mgr = new SystemManager(state);
    const system = new BehaviorSystem(mgr);

    BehaviorComponent.add(entity1);
    BehaviorComponent.add(entity2);

    const expectedMessage = createMessage(Message).from(entity1).to(entity2);

    setUpBehavior(
      "behavior/mock1",
      new CompositeBehavior([
        new SendOnUpdateBehavior(() => expectedMessage, Message.noAnswer)
      ]),
      entity1,
      state
    );

    setUpBehavior("behavior/mock2", new CompositeBehavior([]), entity2, state);

    IsActiveTag.add(entity1);
    IsActiveTag.add(entity2);
    AddedTag.add(entity1);
    AddedTag.add(entity2);

    system.start(state);
    system.updateEarly(state);

    assert(entity1.outbox.getAll(Message).has(expectedMessage));
    assert(entity2.inbox.getAll(Message).has(expectedMessage));
  });

  test("actor's inbox/outbox is empty after each update", () => {
    const world = new World();
    const entity = world.addEntity();
    const state = new MockState();
    const mgr = new SystemManager(state);
    const system = new BehaviorSystem(mgr);

    BehaviorComponent.add(entity);

    setUpBehavior("behavior/mock", new CompositeBehavior([]), entity, state);

    IsActiveTag.add(entity);
    AddedTag.add(entity);

    entity.inbox.add(Message, new Message(entity, entity));
    entity.outbox.add(Message, new Message(entity, entity));

    system.update(state);

    assert.equal(entity.inbox.size, 0);
    assert.equal(entity.outbox.size, 0);
  });

  test("actors can initiate actions", () => {
    class MyAction extends Action<any, any> {
      update() {}
    }
    class MyBehavior extends Behavior<any, any> {
      onEnter(entity: any) {
        return [new MyAction(entity, 0, 0)];
      }
      onUpdateEarly(entity: any) {
        return [new MyAction(entity, 0, 0)];
      }
      onUpdateLate(entity: any) {
        return [new MyAction(entity, 0, 0)];
      }
    }

    const world = new World();
    const entity = world.addEntity();
    const state = new MockState();
    const mgr = new SystemManager(state);
    const system = new BehaviorSystem(mgr);

    BehaviorComponent.add(entity);

    setUpBehavior("behavior/mock", new MyBehavior(), entity, state);

    IsActiveTag.add(entity);
    AddedTag.add(entity);

    system.start(state);

    assert.equal(state.pendingActions.length, 1);
    for (const action of state.pendingActions) {
      assert(action instanceof MyAction);
    }

    system.update(state);

    assert.equal(state.pendingActions.length, 3);
    for (const action of state.pendingActions) {
      assert(action instanceof MyAction);
    }
  });
});
