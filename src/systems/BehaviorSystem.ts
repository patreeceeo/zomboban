import { EntityWithComponents } from "../Component";
import { SystemWithQueries } from "../System";
import {
  InSceneTag,
  BehaviorComponent,
  IsActiveTag,
} from "../components";
import { State } from "../state";
import { Message, MessageHandler } from "../Message";
import { ActionEntity } from "./ActionSystem";
import { Action } from "../Action";
import { importBehaviors } from "../behaviors";
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
  onExit(
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

export class BehaviorSystem extends SystemWithQueries<State> {
  #actors = this.createQuery([BehaviorComponent, IsActiveTag, InSceneTag]);

  #addActionsMaybe(
    actions: Action<any, any>[] | void,
    state: State
  ) {
    if (actions) {
      state.pendingActions.push(...actions);
    }
  }

  async start(state: State) {
    const promise = importBehaviors();
    const { loadingItems } = state;
    loadingItems.add(
      new LoadingItem("behaviors", async () => {
        promise
      })
    );
    const behaviors = await promise;
    for (const [id, Klass] of behaviors) {
      const behavior = new Klass();
      state.addBehavior(id, behavior);
    }
    this.resources.push(
      this.#actors.stream((entity) => {
        const { behaviorId } = entity;
        const behavior = state.getBehavior(behaviorId);
        const actions = behavior.onEnter(entity, state);
        this.#addActionsMaybe(actions, state);
      }),
      this.#actors.onRemove((entity) => {
        const { behaviorId } = entity;
        const behavior = state.getBehavior(behaviorId);
        const actions = behavior.onExit(entity, state);
        this.#addActionsMaybe(actions, state);
      })
    );
  }
  update(state: State) {
    if (state.isPaused) return; // EARLY RETURN!

    this.updateEarly(state);
    this.updateLate(state);
  }

  updateEarly(state: State) {
    for (const entity of this.#actors) {
      const { behaviorId } = entity;
      if (state.hasBehavior(behaviorId)) {
        const behavior = state.getBehavior(behaviorId);
        const actions = behavior.onUpdateEarly(entity, state);
        this.#addActionsMaybe(actions, state);
      }
    }
  }

  updateLate(state: State) {
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
