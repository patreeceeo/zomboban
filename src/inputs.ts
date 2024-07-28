import { MoveAction } from "./actions";
import {
  ActionsState,
  MetaState,
  MetaStatus,
  RouterState,
  TimeState
} from "./state";
import { UndoState } from "./systems/ActionSystem";
import { routeTo } from "./systems/RouterSystem";

export function handleToggleMenu(state: RouterState) {
  if (state.currentRoute === "game") {
    routeTo("pauseMenu");
  } else {
    routeTo("game");
  }
}

export function handleToggleEditor(state: RouterState) {
  if (state.currentRoute === "game") {
    routeTo("editor");
  } else {
    routeTo("game");
  }
}

export function handleUndo(state: ActionsState) {
  const action = state.completedActions.findLast(
    (a) => a.entity.behaviorId === "behavior/player" && a instanceof MoveAction
  );
  if (action) {
    state.undoState = UndoState.FinishPendingActions;
    state.undoActionId = action.id;
  }
}

export function handleRestart(state: MetaState) {
  state.metaStatus = MetaStatus.Restart;
}

export function handleRewind(state: ActionsState & TimeState) {
  state.isPaused = false;
  state.undoState = UndoState.FinishPendingActions;
  state.undoActionId = 0;
}

export function handlePlay(state: ActionsState & TimeState) {
  state.isPaused = false;
  // TODO necessary?
  state.undoingActions.length = 0;
}

export function handlePause(state: ActionsState & TimeState) {
  state.isPaused = true;
}

export function handleShowMenu() {
  routeTo("pauseMenu");
}

export const inputHandlers = {
  handleRestart,
  handleRewind,
  handlePlay,
  handlePause
};
