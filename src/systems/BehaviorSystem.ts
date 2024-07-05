import { EntityWithComponents } from "../Component";
import { SystemWithQueries } from "../System";
import { AddedTag, BehaviorComponent, IsActiveTag } from "../components";
import {
  ActionsState,
  BehaviorState,
  QueryState,
  TilesState,
  TimeState
} from "../state";
import { Message } from "../Message";
import { ActionEntity, UndoState } from "./ActionSystem";
import { Action } from "../Action";

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
  static id = "behavior/unknown";

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
  onUpdateLate(
    entity: Entity,
    context: Context
  ): void | Action<ActionEntity<any>, any>[] {
    void entity;
    void context;
  }
  onReceive(message: Message<any>, entity: Entity, context: Context) {
    void message;
    void entity;
    void context;
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
  TilesState &
  QueryState &
  ActionsState &
  TimeState;

export class BehaviorSystem extends SystemWithQueries<BehaviorSystemContext> {
  #actors = this.createQuery([BehaviorComponent, IsActiveTag, AddedTag]);

  #addActionsMaybe(
    actions: Action<any, any>[] | void,
    state: BehaviorSystemContext
  ) {
    if (actions) {
      state.pendingActions.push(...actions);
    }
  }

  start(state: BehaviorSystemContext) {
    this.resources.push(
      this.#actors.stream((entity) => {
        const behavior = state.getBehavior(entity.behaviorId);
        if (!behavior) {
          console.warn(`Behavior ${entity.behaviorId} not found`);
          return;
        }

        const actions = behavior.onEnter(entity, state);
        this.#addActionsMaybe(actions, state);
      })
    );
  }
  update(state: BehaviorSystemContext) {
    if (state.isPaused) return; // EARLY RETURN!
    if (state.undoState !== UndoState.NotUndoing) {
      // All message answers will be potentially invalid after undoing
      // for (const entity of this.#actors) {
      //   entity.inbox.clear();
      //   entity.outbox.clear();
      // }
      return; // EARLY RETURN!
    }

    this.updateEarly(state);
    this.updateLate(state);
  }

  updateEarly(state: BehaviorSystemContext) {
    for (const entity of this.#actors) {
      const behavior = state.getBehavior(entity.behaviorId);
      const actions = behavior.onUpdateEarly(entity, state);
      this.#addActionsMaybe(actions, state);
    }
  }

  updateLate(state: BehaviorSystemContext) {
    for (const entity of this.#actors) {
      const behavior = state.getBehavior(entity.behaviorId);
      const actions = behavior.onUpdateLate(entity, state);
      this.#addActionsMaybe(actions, state);
      entity.inbox.clear();
      entity.outbox.clear();
    }
  }
}
