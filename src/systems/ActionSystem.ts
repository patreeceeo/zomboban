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
import {BehaviorEnum} from "../behaviors";
import {getMoveTime} from "../actions";

type State = ActionsState &
  TimeState &
  EntityManagerState &
  QueryState &
  RendererState;

export type ActionEntity<Components extends IReadonlyComponentDefinition<any>> =
  EntityWithComponents<Components | typeof BehaviorComponent>;

interface IUndoState {
  update(state: State): void;
}

const NotUndoing: IUndoState = {
  update(state) {
    const { pendingActions, completedActions } = state;
    if (pendingActions.length > 0) {
      state.time += state.dt;
      state.isAtStart = false;
    }

    let playerAction: Action<any, any> | undefined;
    for(const action of pendingActions) {
      if (action.entity.behaviorId === BehaviorEnum.Player) {
        playerAction = action;
        break;
      }
    }

    if (playerAction) {
      if(playerAction.progress === 0) {
        state.timeSinceLastPlayerAction.unshift(0);
      }
    } else if (state.timeSinceLastPlayerAction.length > 0) {
      state.timeSinceLastPlayerAction[0] += state.dt;
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

    const { pendingActions, completedActions, undoingActions } = state;
    if (pendingActions.length === 0 && completedActions.length > 0) {
      state.undoState = UndoState.Undoing;
      // set timeScale such that the amount of time it takes to undo the last player action is always the same
      state.timeScale = Math.max(
        1,
        (state.timeSinceLastPlayerAction[0]) / getMoveTime()
      )
      state.$completedActionCount = state.completedActions.length;
      state.$completedActionCountBeforeUndo = state.completedActions.length;
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
        // invariant(action.id === state.undoActionId, `Programmer error`);
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
    state.$completedActionCount = state.undoingActions.length;

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
      state.timeScale = 1;
      state.timeSinceLastPlayerAction.shift();
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
    this.resources.push(
      this.behaviorQuery.onRemove((entity) => {
        state.pendingActions.filterInPlace((action) => {
          return action.entity !== entity;
        });
      }),
      // TODO It's a little weird to handle onStart this way, since onComplete is not, but this is the best grug developer could think.
      // How to have ActionSystem be responsible for Actions while not calling onStart more than once?
      // This is the question grug brain struggling with.
      state.pendingActions.onAdd((action) => {
        action.onStart(state);
      }),
      state.pendingActions.onRemove((action) => {
        // Though you might expect this be performed by Action.onComplete, actions can be removed
        // without being completed, such as in ActionSystem.stop.
        action.entity.actions.delete(action);
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
    state.isUndoing = state.undoState !== UndoState.NotUndoing;
  }
  stop(state: State) {
    state.pendingActions.length = 0;
    state.completedActions.length = 0;
    state.undoingActions.length = 0;
  }
}
