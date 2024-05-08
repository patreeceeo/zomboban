import { Vector2 } from "three";
import { SystemWithQueries } from "../System";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent, ChangedTag } from "../components";
import {
  ActionsState,
  LogState,
  EntityManagerState,
  QueryState,
  RendererState
} from "../state";
import { filterArrayInPlace } from "../functions/Array";
import { Log } from "./LogSystem";

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

type State = ActionsState &
  EntityManagerState &
  QueryState &
  RendererState &
  LogState;

let id = 0;

export abstract class Action<Entity, Context> {
  addDependency(action: Action<Entity, Context>) {
    this.dependsOn.push(action);
    action.cause = this;
  }
  abstract bind(entity: Entity): void;
  abstract stepForward(entity: Entity, context: Context): void;
  abstract stepBackward(entity: Entity, context: Context): void;
  id = ++id;
  // TODO need a better way to address actions to particular entities?
  effectedArea: Vector2[] = [];
  progress = 0;
  cause: Action<any, any> | undefined;
  dependsOn: Action<any, any>[] = [];
  driver: ActionDriver<any, Context> | undefined;
  cancelled = false;
  canUndo = true;
}

// TODO: rename to ActionEnvelope? or subsume into Action?
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
  // TODO addDependency method?
}

export class ActionSystem extends SystemWithQueries<State> {
  behaviorQuery = this.createQuery([BehaviorComponent]);
  #log = new Log("ActionSystem");
  start(state: State) {
    state.logs.addLog(this.#log);
  }
  update(state: State) {
    const { pendingActions, completedActions, undoingActions } = state;

    state.shouldRerender ||=
      pendingActions.length > 0 || undoingActions.length > 0;

    for (const driver of pendingActions) {
      const { action } = driver;
      if (action.cancelled) {
        driver.entity.actions.delete(action);
        let current: Action<any, any> | undefined = action;
        while (current.cause) {
          current = current.cause;
          current.cancelled = true;
          current.driver!.entity.actions.delete(current);
          current.driver!.entity.cancelledActions.add(current);
        }
      }
    }

    // filter out directly and indirectly cancelled actions
    filterArrayInPlace(pendingActions, ({ action }) => !action.cancelled);

    if (!state.undo) {
      for (const action of pendingActions) {
        action.stepForward(state);
        this.#log.writeLn(
          `Running ${action.action.constructor.name} ${action.action.id}`
        );
      }

      let complete = true;
      for (const action of pendingActions) {
        complete = complete && action.action.progress >= 1;
      }
      if (complete && pendingActions.length > 0) {
        const undoableActions = pendingActions.filter(
          ({ action }) => action.canUndo
        );
        if (undoableActions.length > 0) {
          completedActions.push(undoableActions);
        }
        for (const action of pendingActions) {
          action.entity.actions.clear();
          ChangedTag.add(action.entity);
        }
        state.pendingActions.length = 0;
      }
    } else {
      if (undoingActions.length === 0 && completedActions.length > 0) {
        const actions = completedActions.pop()!;
        undoingActions.push(...actions);
        for (const driver of actions) {
          driver.entity.actions.add(driver.action);
        }
      }
      for (const action of undoingActions) {
        action.stepBackward(state);
      }

      let complete = true;
      for (const action of undoingActions) {
        complete = complete && action.action.progress <= 0;
      }

      if (complete) {
        for (const action of undoingActions) {
          action.entity.actions.clear();
          ChangedTag.add(action.entity);
        }
        state.undoingActions.length = 0;
        state.undo = false;
      }
    }
  }
}
