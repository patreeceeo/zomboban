import { SystemWithQueries } from "../System";
import {
  EntityWithComponents,
  IReadonlyComponentDefinition
} from "../Component";
import { BehaviorComponent, ChangedTag } from "../components";
import {
  ActionsState,
  EntityManagerState,
  QueryState,
  RendererState,
  TimeState
} from "../state";
import { invariant } from "../Error";
import { Action } from "../Action";

type State = ActionsState &
  TimeState &
  EntityManagerState &
  QueryState &
  RendererState;

export type ActionEntity<Components extends IReadonlyComponentDefinition<any>> =
  EntityWithComponents<Components | typeof BehaviorComponent>;

declare const timeScaleInput: HTMLInputElement;
declare const undoFeedbackElement: HTMLElement;

interface IUndoState {
  update(state: State): void;
}

const NotUndoing: IUndoState = {
  update(state) {
    const { pendingActions, completedActions } = state;
    if (pendingActions.length > 0) {
      state.time += state.dt;
    }

    for (const action of pendingActions) {
      action.seek(state.dt);
      action.update(state);
    }

    pendingActions.filterInPlace((action) => {
      const actionInProgress = action.progress < 1;
      if (!actionInProgress) {
        // Add changed tag so the tile position is updated
        // console.log("adding changed tag because of", action.toString());
        ChangedTag.add(action.entity);
        action.onComplete(state);
        if (action.canUndo) {
          completedActions.push(action);

          // TODO test
          if (completedActions.length > Action.MAX_HISTORY) {
            completedActions.shift();
          }
        }
      }
      return actionInProgress;
    });
  }
};

const FinishPendingActions: IUndoState = {
  update(state) {
    NotUndoing.update(state);

    undoFeedbackElement.style.display = "flex";
    const { pendingActions, completedActions, undoingActions } = state;
    if (pendingActions.length === 0 && completedActions.length > 0) {
      state.undoState = UndoState.Undoing;
      let action: Action<any, any>;
      while (
        (action = completedActions.pop()!) &&
        action !== undefined &&
        action.id > state.undoActionId
      ) {
        // console.log("including action", action.toString());
        undoingActions.unshift(action);
      }
      // find concurrent actions and include those as well
      if (action) {
        invariant(action.id === state.undoActionId, `Programmer error`);
        undoingActions.unshift(action);
        // console.log("including earliest action", action.toString());
        while (
          completedActions.length > 0 &&
          action.overlaps(completedActions.at(-1)!)
        ) {
          const overlappingAction = completedActions.pop()!;
          // console.log(
          //   "also including overlapping action",
          //   overlappingAction.toString()
          // );
          undoingActions.unshift(overlappingAction);
        }
      }
    }
  }
};

const Undoing: IUndoState = {
  update(state) {
    const { undoingActions } = state;
    state.time -= state.dt;

    // Run `undoingActions` in reverse

    /* An attempted optimization:
        const actionLastThatEndsAfterNow = undoingActions.findLast(
          (action) => action.startTime >= state.time
        );

        const idStopAt = actionLastThatEndsAfterNow
          ? actionLastThatEndsAfterNow.id
          : 0;

        let index = undoingActions.length - 1;
        let action: Action<any, any>;
        do {
          action = undoingActions.at(index)!;
          action.seek(-state.dt);
          action.update(state);
          index--;
        } while (action.id > idStopAt && index > 0);
        */
    for (const action of undoingActions) {
      if (state.time < action.endTime) {
        // action.onStart();
        const dt = Math.min(state.dt, action.endTime - state.time);
        action.seek(-dt);
        action.update(state);
      }
    }

    // Remove completed actions and perform some final operations.
    undoingActions.filterInPlace((action) => {
      const actionComplete = action.progress <= 0;
      if (actionComplete) {
        // Add changed tag so the tile position is updated
        ChangedTag.add(action.entity);
        // console.log("COMPLETED action that started at", action.startTime);
        // action.onComplete();
      }
      return !actionComplete;
    });

    // console.log(
    //   "undoing",
    //   undoingActions.length,
    //   "actions, time",
    //   state.time,
    //   "last action started at",
    //   undoingActions.at(0)?.startTime
    // );
    if (
      undoingActions.length === 0 ||
      state.time < undoingActions.at(0)!.startTime
    ) {
      state.undoState = UndoState.NotUndoing;
      undoFeedbackElement.style.display = "none";
    }
  }
};

export const UndoState: Record<string, IUndoState> = {
  NotUndoing,
  FinishPendingActions,
  Undoing
} as const;

export class ActionSystem extends SystemWithQueries<State> {
  behaviorQuery = this.createQuery([BehaviorComponent]);
  changedQuery = this.createQuery([ChangedTag]);
  start(state: State) {
    if (process.env.NODE_ENV === "development") {
      state.timeScale = parseFloat(timeScaleInput.value);
      timeScaleInput.onchange = () => {
        state.timeScale = parseFloat(timeScaleInput.value);
      };
    }

    this.resources.push(
      // TODO It's a little weird to handle onStart this way, since onComplete is not, but this is the best grug developer could think.
      // How to have ActionSystem be responsible for Actions while not calling onStart more than once?
      // This is the question grug brain struggling with.
      state.pendingActions.onAdd((action) => {
        action.onStart(state);
      })
    );
  }
  update(state: State) {
    if (state.isPaused) return; // EARLY RETURN!

    for (const entity of this.changedQuery) {
      ChangedTag.remove(entity);
    }

    state.shouldRerender ||=
      state.pendingActions.length > 0 || state.undoingActions.length > 0;

    state.undoState.update(state);
  }
  stop(state: State) {
    state.pendingActions.length = 0;
    state.completedActions.length = 0;
    state.undoingActions.length = 0;
  }
}
