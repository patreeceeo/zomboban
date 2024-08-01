import { cookieStore } from "cookie-store";
import { MoveAction } from "./actions";
import { editorRoute, gameRoute, menuRoute } from "./routes";
import {
  ActionsState,
  ClientState,
  MetaState,
  MetaStatus,
  RouterState,
  TimeState
} from "./state";
import { UndoState } from "./systems/ActionSystem";
import { SESSION_COOKIE_NAME } from "./constants";

export function handleToggleMenu(state: RouterState) {
  if (state.currentRoute.equals(gameRoute)) {
    // routeTo("pauseMenu");
  } else {
    gameRoute.follow();
  }
}

export function handleToggleEditor(state: RouterState) {
  if (state.currentRoute.equals(gameRoute)) {
    editorRoute.follow();
  } else {
    gameRoute.follow();
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
  menuRoute.follow();
}

export async function handleSignOut(state: ClientState) {
  cookieStore.delete(SESSION_COOKIE_NAME);
  state.isSignedIn = false;
}

export const inputHandlers = {
  handleRestart,
  handleRewind,
  handlePlay,
  handlePause,
  handleSignOut
};
