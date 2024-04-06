import { Vector2 } from "three";
import { SystemWithQueries } from "../System";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent, ChangedTag, ChangingTag } from "../components";
import { ActionsState, EntityManagerState, QueryState } from "../state";
import { invariant } from "../Error";
import { filterArrayInPlace } from "../functions/Array";

/**
 * @fileoverview an application of the command pattern. I just like the word "action" better.
 *
 * Motivation: support undo/redo.
 *
 * Rules of Actions:
 *  - All state mutation should be done through actions.
 *  - Once an action is added to the queue, it will be applied in the current frame.
 *  - Actions should be regarded as immutable.
 *  - The action does what it says. Keep it simple.
 *  - Avoid control flow statements (if, switch, for, while...) in actions.
 *     - Instead, make sure that only the appropriate actions are added to the queue.
 *
 *
 */

type State = ActionsState & EntityManagerState & QueryState;

let id = 0;

export abstract class Action<Entity, Context> {
  chain(action: Action<Entity, Context>) {
    this.dependsOn.push(action);
    action.cause = this;
  }
  abstract bind(entity: Entity): void;
  abstract stepForward(entity: Entity, context: Context): void;
  abstract stepBackward(entity: Entity, context: Context): void;
  id = ++id;
  effectedArea: Vector2[] = [];
  progress = 0;
  cause: Action<any, any> | undefined;
  dependsOn: Action<any, any>[] = [];
  driver: ActionDriver<any, Context> | undefined;
  cancelled = false;
}

export class ActionDriver<
  Entity extends EntityWithComponents<typeof BehaviorComponent>,
  Context
> {
  constructor(
    readonly action: Action<Entity, Context>,
    readonly entity: Entity
  ) {
    action.bind(entity);
    action.driver = this;
    entity.actions.add(action);
  }
  stepForward(context: Context) {
    this.action.stepForward(this.entity, context);
  }
  stepBackward(context: Context) {
    this.action.stepBackward(this.entity, context);
  }
}

export class ActionSystem extends SystemWithQueries<State> {
  behaviorQuery = this.createQuery([BehaviorComponent]);
  start(state: State) {
    state.entities.stream((entity) => {
      ChangedTag.add(entity);
    });
  }
  update(state: State) {
    const { pendingActions, completedActions } = state;

    for (const entity of this.behaviorQuery) {
      if (entity.actions.size === 0) {
        ChangingTag.remove(entity);
      }
    }

    for (const driver of pendingActions) {
      const { action } = driver;
      if (action.cancelled) {
        driver.entity.actions.delete(action);
        let current: Action<any, any> | undefined = action;
        while (current.cause) {
          current = current.cause;
          current.cancelled = true;
          current.driver!.entity.actions.delete(current);
        }
      }
    }

    // filter out directly and indirectly cancelled actions
    filterArrayInPlace(pendingActions, ({ action }) => !action.cancelled);

    if (!state.undo) {
      for (const action of pendingActions) {
        ChangingTag.add(action.entity);
        action.stepForward(state);
      }

      let complete = true;
      for (const action of pendingActions) {
        complete = complete && action.action.progress >= 1;
      }
      if (complete && pendingActions.length > 0) {
        completedActions.push(pendingActions);
        for (const action of pendingActions) {
          action.entity.actions.clear();
          ChangedTag.add(action.entity);
        }
        state.pendingActions = [];
      }
    } else {
      if (pendingActions.length === 0) {
        invariant(completedActions.length > 0, "No actions to undo");
        const actions = completedActions.pop()!;
        pendingActions.push(...actions);
        for (const driver of actions) {
          driver.entity.actions.add(driver.action);
        }
      }
      for (const action of pendingActions) {
        console.log("Undoing", action.action.constructor.name);
        action.stepBackward(state);
        ChangingTag.add(action.entity);
      }

      let complete = true;
      for (const action of pendingActions) {
        complete = complete && action.action.progress <= 0;
      }

      if (complete) {
        for (const action of pendingActions) {
          action.entity.actions.clear();
          ChangedTag.add(action.entity);
        }
        state.pendingActions = [];
        state.undo = false;
      }
    }
  }
}
