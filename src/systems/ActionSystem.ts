import { Vector2 } from "three";
import { System } from "../System";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent } from "../components";
import { ActionsState } from "../state";
import { invariant } from "../Error";

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

type State = ActionsState;

let id = 0;

export abstract class Action<Entity, Context> {
  abstract bind(entity: Entity): void;
  abstract stepForward(entity: Entity, context: Context): void;
  abstract stepBackward(entity: Entity, context: Context): void;
  id = ++id;
  effectedArea: Vector2[] = [];
  progress = 0;
  cause: Action<any, any> | undefined;
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
    entity.actions.add(action);
  }
  stepForward(context: Context) {
    this.action.stepForward(this.entity, context);
  }
  stepBackward(context: Context) {
    this.action.stepBackward(this.entity, context);
  }
}

export class ActionSystem extends System<State> {
  update(state: State) {
    const { pendingActions, completedActions } = state;

    if (!state.undo) {
      for (const action of pendingActions) {
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
        }
        state.pendingActions = [];
      }
    } else {
      if (pendingActions.length === 0) {
        invariant(completedActions.length > 0, "No actions to undo");
        const actions = completedActions.pop()!;
        pendingActions.push(...actions);
      }
      for (const action of pendingActions) {
        action.stepBackward(state);
      }

      let complete = true;
      for (const action of pendingActions) {
        complete = complete && action.action.progress <= 0;
      }

      if (complete) {
        state.pendingActions = [];
        state.undo = false;
      }
    }
  }
}
