import { EntityWithComponents } from "../Component";
import { SystemWithQueries } from "../System";
import {
  InSceneTag,
  BehaviorComponent,
  IsActiveTag,
  TilePositionComponent,
} from "../components";
import { State } from "../state";
import { Message, MessageHandler } from "../Message";
import { ActionEntity } from "./ActionSystem";
import { Action } from "../Action";
import { importBehaviors } from "../behaviors";
import { LoadingItem } from "./LoadingSystem";
import { getEntityMeta } from "../Entity";

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

  #getSortedActors() {
    // Convert to array for sorting
    const actors = Array.from(this.#actors);

    // Sort by spatial position for entities that have TilePositionComponent
    // Otherwise maintain their relative order
    actors.sort((a, b) => {
      const hasTilePosA = TilePositionComponent.has(a);
      const hasTilePosB = TilePositionComponent.has(b);

      // If both have tile positions, sort spatially
      if (hasTilePosA && hasTilePosB) {
        const posA = a.tilePosition;
        const posB = b.tilePosition;

        // Sort by Y (top to bottom)
        if (posA.y !== posB.y) {
          return posA.y - posB.y;
        }

        // Then by X (left to right)
        if (posA.x !== posB.x) {
          return posA.x - posB.x;
        }

        // Finally by entity ID for stable ordering
        return getEntityMeta(a).id - getEntityMeta(b).id;
      }

      // If only one has tile position, put it first
      if (hasTilePosA && !hasTilePosB) return -1;
      if (!hasTilePosA && hasTilePosB) return 1;

      // If neither has tile position, sort by ID
      return getEntityMeta(a).id - getEntityMeta(b).id;
    });

    return actors;
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
      state.behavior.set(id, behavior);
    }
    this.resources.push(
      this.#actors.stream((entity) => {
        const { behaviorId } = entity;
        const behavior = state.behavior.get(behaviorId);
        const actions = behavior.onEnter(entity, state);
        this.#addActionsMaybe(actions, state);
      }),
      this.#actors.onRemove((entity) => {
        const { behaviorId } = entity;
        const behavior = state.behavior.get(behaviorId);
        const actions = behavior.onExit(entity, state);
        this.#addActionsMaybe(actions, state);
      })
    );
  }
  update(state: State) {
    if (state.time.isPaused) return; // EARLY RETURN!

    this.updateEarly(state);
    this.updateLate(state);
  }

  updateEarly(state: State) {
    // Sort entities for deterministic processing order
    const sortedActors = this.#getSortedActors();

    for (const entity of sortedActors) {
      const { behaviorId } = entity;
      if (state.behavior.has(behaviorId)) {
        const behavior = state.behavior.get(behaviorId);
        const actions = behavior.onUpdateEarly(entity, state);
        this.#addActionsMaybe(actions, state);
      }
    }
  }

  updateLate(state: State) {
    // Sort entities for deterministic processing order
    const sortedActors = this.#getSortedActors();

    for (const entity of sortedActors) {
      const { behaviorId } = entity;
      if (state.behavior.has(behaviorId)) {
        const behavior = state.behavior.get(behaviorId);
        const actions = behavior.onUpdateLate(entity, state);
        this.#addActionsMaybe(actions, state);
        entity.inbox.clear();
        entity.outbox.clear();
      }
    }
  }
}
