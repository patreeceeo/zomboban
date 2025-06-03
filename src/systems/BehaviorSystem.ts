import { EntityWithComponents } from "../Component";
import { SystemWithQueries } from "../System";
import {
  InSceneTag,
  BehaviorComponent,
  IsActiveTag,
} from "../components";
import {
  ActionsState,
  BehaviorState,
  LoadingState,
  QueryState,
  TimeState
} from "../state";
import { Message, MessageHandler } from "../Message";
import { ActionEntity } from "./ActionSystem";
import { Action } from "../Action";
import { ITilesState } from "./TileSystem";
import { BehaviorEnum, importBehavior } from "../behaviors";
import { LoadingItem } from "./LoadingSystem";

/** The shared behavior for entities. Each entity contains its own unique state via components. Part of that state is a reference to a behavior, allowing entities to "implement" a few ways of interacting with their environment.
 * A. By deciding how to act when a system event (enter, updateEarly...) occurs.
 * B. By deciding how to act when they've received a message from another entity.
 *
 * Where:
 *   - 'to act' means returning Actions
 * */
export abstract class Behavior<
  Entity extends EntityWithComponents<typeof BehaviorComponent>,
  Context
> {
  onEnter(
    entity: Entity,
    context: Context
  ): void | Action<ActionEntity<any>, any>[] {
    void entity;
    void context;
  }
  onUpdateEarly(
    entity: Entity,
    context: Context
  ): void | Action<ActionEntity<any>, any>[] {
    void entity;
    void context;
  }
  // TODO might be unnecessary
  onUpdateLate(
    entity: Entity,
    context: Context
  ): void | Action<ActionEntity<any>, any>[] {
    void entity;
    void context;
  }
  messageHandlers = {} as Record<string, MessageHandler<Entity, Context, any>>;
  onReceive<PResponse>(
    message: Message<PResponse>,
    entity: Entity,
    context: Context
  ): PResponse | undefined {
    const { messageHandlers } = this;
    if (message.type in messageHandlers) {
      return messageHandlers[message.type](entity, context, message);
    }
  }
  onCompose(composite: Behavior<Entity, Context>) {
    void composite;
  }
}

export class CompositeBehavior<
  Entity extends EntityWithComponents<typeof BehaviorComponent>,
  Context
> extends Behavior<Entity, Context> {
  constructor(readonly behaviors: Behavior<Entity, Context>[]) {
    super();
    for (const b of behaviors) {
      b.onCompose(this);
    }
  }

  onEnter(entity: Entity, context: Context) {
    const allActions = [];
    for (const b of this.behaviors) {
      const actions = b.onEnter(entity, context);
      if (actions) {
        allActions.push(...actions);
      }
    }
    return allActions;
  }

  onUpdateEarly(entity: Entity, context: Context) {
    const allActions = [];
    for (const b of this.behaviors) {
      const actions = b.onUpdateEarly(entity, context);
      if (actions) {
        allActions.push(...actions);
      }
    }
    return allActions;
  }

  onUpdateLate(entity: Entity, context: Context) {
    const allActions = [];
    for (const b of this.behaviors) {
      const actions = b.onUpdateLate(entity, context);
      if (actions) {
        allActions.push(...actions);
      }
    }
    return allActions;
  }

  onReceive(message: Message<any>, entity: Entity, context: Context): any {
    let retval;
    for (const b of this.behaviors) {
      retval ??= b.onReceive(message, entity, context);
    }
    return retval;
  }
}

type MaybeBehaviorEntity = Partial<
  EntityWithComponents<typeof BehaviorComponent>
>;

export function hasSameBehavior(
  a: MaybeBehaviorEntity,
  b: MaybeBehaviorEntity
) {
  return (
    "behaviorId" in a && "behaviorId" in b && a.behaviorId === b.behaviorId
  );
}

type BehaviorSystemContext = BehaviorState &
  ITilesState &
  QueryState &
  ActionsState &
  TimeState &
  LoadingState;

export class BehaviorSystem extends SystemWithQueries<BehaviorSystemContext> {
  #actors = this.createQuery([BehaviorComponent, IsActiveTag, InSceneTag]);

  #addActionsMaybe(
    actions: Action<any, any>[] | void,
    state: BehaviorSystemContext
  ) {
    if (actions) {
      state.pendingActions.push(...actions);
    }
  }

  async #importOrGetBehavior(state: BehaviorSystemContext, id: BehaviorEnum) {
    if (!state.hasBehavior(id)) {
      const Klass = await importBehavior(id);
      return new Klass();
    } else {
      return state.getBehavior(id);
    }
  }

  start(state: BehaviorSystemContext) {
    const { loadingItems } = state;
    this.resources.push(
      this.#actors.stream(async (entity) => {
        const id = entity.behaviorId;
        console.log(`BehaviorSystem: starting behavior ${id}`);
        const promise = this.#importOrGetBehavior(state, id);
        loadingItems.add(
          new LoadingItem(id, async () => {
            await promise;
          })
        );
        const behavior = await promise;
        state.addBehavior(id, behavior);
        const actions = behavior.onEnter(entity, state);
        this.#addActionsMaybe(actions, state);
      })
    );
  }
  update(state: BehaviorSystemContext) {
    if (state.isPaused) return; // EARLY RETURN!

    this.updateEarly(state);
    this.updateLate(state);
  }

  updateEarly(state: BehaviorSystemContext) {
    for (const entity of this.#actors) {
      const { behaviorId } = entity;
      if (state.hasBehavior(behaviorId)) {
        const behavior = state.getBehavior(behaviorId);
        const actions = behavior.onUpdateEarly(entity, state);
        this.#addActionsMaybe(actions, state);
      }
    }
  }

  updateLate(state: BehaviorSystemContext) {
    for (const entity of this.#actors) {
      const { behaviorId } = entity;
      if (state.hasBehavior(behaviorId)) {
        const behavior = state.getBehavior(behaviorId);
        const actions = behavior.onUpdateLate(entity, state);
        this.#addActionsMaybe(actions, state);
        entity.inbox.clear();
        entity.outbox.clear();
      }
    }
  }
}
