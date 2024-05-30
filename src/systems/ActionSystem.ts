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
  RendererState,
  TimeState
} from "../state";
import { popFromSet } from "../functions/Set";
import { invariant } from "../Error";
import { Matrix } from "../Matrix";
import { convertToTiles } from "../units/convert";

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
 */

type State = ActionsState &
  TimeState &
  EntityManagerState &
  QueryState &
  RendererState &
  LogState;

export abstract class Action<
  Entity extends EntityWithComponents<typeof BehaviorComponent>,
  Context
> {
  constructor(
    readonly entity: Entity,
    readonly startTime: number,
    readonly maxElapsedTime: number
  ) {
    entity.actions.add(this);
  }
  abstract update(context: Context): void;
  // TODO need a better way to address actions to particular entities?
  #effectedArea = new Matrix<boolean>();
  #effectedTileCoords = [] as Vector2[];
  addEffectedTile(x: number, y: number) {
    const area = this.#effectedArea;
    const tileX = convertToTiles(x);
    const tileY = convertToTiles(y);
    if (!area.has(tileX, tileY)) {
      this.#effectedArea.set(tileX, tileY, true);
      this.#effectedTileCoords.push(new Vector2(tileX, tileY));
    }
    return this;
  }
  listEffectedTiles() {
    return this.#effectedTileCoords;
  }
  #progress = 0;
  get progress() {
    return this.#progress;
  }
  seek(deltaTime: number) {
    this.#progress = Math.max(
      0,
      Math.min(1, this.progress + deltaTime / this.maxElapsedTime)
    );
  }
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

declare const timeScaleInput: HTMLInputElement;

export class ActionSystem extends SystemWithQueries<State> {
  wasUndoing = false;
  behaviorQuery = this.createQuery([BehaviorComponent]);
  start(state: State) {
    timeScaleInput.onchange = () => {
      state.timeScale = parseFloat(timeScaleInput.value);
    };
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
    pendingActions.filterInPlace((action) => !action.cancelled);

    if (!state.undoInProgress) {
      state.time += state.dt;
      for (const action of pendingActions) {
        action.seek(state.dt);
        action.update(state);
      }

      pendingActions.filterInPlace((action) => {
        const actionInProgress = action.progress < 1;
        if (!actionInProgress) {
          action.entity.actions.delete(action);
          ChangedTag.add(action.entity);
          if (action.canUndo) {
            completedActions.push(action);
          }
        }
        return actionInProgress;
      });
    } else {
      let loopCount = 0;
      let actionStarted = false;

      if (!this.wasUndoing) {
        for (const entity of this.behaviorQuery) {
          entity.actions.clear();
        }
        pendingActions.length = 0;
      }

      while (!actionStarted && loopCount < 100) {
        loopCount++;

        state.time = Math.max(state.undoUntilTime, state.time - state.dt);

        completedActions.filterInPlace((action) => {
          const endTime =
            (action?.startTime ?? -Infinity) + (action?.maxElapsedTime ?? 0);
          const timeIsWithinAction = endTime >= state.time;

          if (timeIsWithinAction) {
            undoingActions.push(action);
            action!.entity.actions.add(action);
            actionStarted = true;
          }

          return !timeIsWithinAction;
        });

        if (state.undoUntilTime >= state.time) {
          break;
        }
      }

      for (const action of undoingActions) {
        action.seek(-state.dt);
        action.update(state);
      }

      undoingActions.filterInPlace((action) => {
        const actionComplete = action.progress <= 0;
        if (actionComplete) {
          action.entity.actions.delete(action);
          ChangedTag.add(action.entity);
        }
        return !actionComplete;
      });
      // console.log(
      //   "time is up?",
      //   state.undoUntilTime >= state.time,
      //   "undoing actions?",
      //   undoingActions.length > 0
      // );
      if (state.undoUntilTime >= state.time && undoingActions.length === 0) {
        state.undoInProgress = false;
      }
    }
    this.wasUndoing = state.undoInProgress;
  }
  stop(state: State) {
    state.pendingActions.length = 0;
    state.completedActions.length = 0;
    state.undoingActions.length = 0;
  }
}
