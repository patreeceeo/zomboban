import { Vector2 } from "three";
import { SystemWithQueries } from "../System";
import {
  EntityWithComponents,
  IReadonlyComponentDefinition
} from "../Component";
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
import { popFromSet } from "../functions/Set";
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

type State = ActionsState &
  EntityManagerState &
  QueryState &
  RendererState &
  LogState;

let id = 0;

export abstract class Action<
  Entity extends EntityWithComponents<typeof BehaviorComponent>,
  Context
> {
  constructor(readonly entity: Entity) {
    entity.actions.add(this);
  }
  abstract stepForward(context: Context): void;
  abstract stepBackward(context: Context): void;
  id = ++id;
  // TODO need a better way to address actions to particular entities?
  effectedArea: Vector2[] = [];
  progress = 0;
  causes = new Set<Action<any, any>>();
  cancelled = false;
  canUndo = true;
  toString() {
    return `${this.constructor.name} from ${this.entity.behaviorId}`;
  }
}

export type ActionEntity<Components extends IReadonlyComponentDefinition<any>> =
  EntityWithComponents<Components | typeof BehaviorComponent>;

function applyCancellations(action: Action<ActionEntity<any>, any>) {
  const actionsToCancel = new Set([action]);
  let loopCount = 0;
  while (actionsToCancel.size > 0 && loopCount < 10) {
    const actionToCancel = popFromSet(actionsToCancel);
    const { entity } = actionToCancel;
    entity.actions.delete(actionToCancel);
    entity.cancelledActions.add(actionToCancel);
    actionToCancel.cancelled = true;
    for (const cause of actionToCancel.causes) {
      actionsToCancel.add(cause);
    }
    loopCount++;
  }
  invariant(
    actionsToCancel.size === 0,
    `Encountered an action tree with more nodes than expected`
  );
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

    for (const action of pendingActions) {
      if (action.cancelled) {
        applyCancellations(action);
      }
    }

    // filter out directly and indirectly cancelled actions
    filterArrayInPlace(pendingActions, (action) => !action.cancelled);

    if (!state.undo) {
      for (const action of pendingActions) {
        action.stepForward(state);
        this.#log.writeLn(`Running ${action.constructor.name} ${action.id}`);
      }

      let complete = true;
      for (const action of pendingActions) {
        complete = complete && action.progress >= 1;
      }
      if (complete && pendingActions.length > 0) {
        const undoableActions = pendingActions.filter(
          (action) => action.canUndo
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
        for (const action of actions) {
          action.entity.actions.add(action);
        }
      }
      for (const action of undoingActions) {
        action.stepBackward(state);
      }

      let complete = true;
      for (const action of undoingActions) {
        complete = complete && action.progress <= 0;
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
