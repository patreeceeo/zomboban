import { cookieStore } from "cookie-store";
import { MoveAction } from "./actions";
import { editorRoute, gameRoute, menuRoute } from "./routes";
import {
  ActionsState,
  ClientState,
  DevToolsState,
  EntityManagerState,
  MetaState,
  RouterState,
  TimeState
} from "./state";
import { UndoState } from "./systems/ActionSystem";
import { SESSION_COOKIE_NAME } from "./constants";
import { ServerIdComponent } from "./components";
import { deserializeEntity, serializeEntity } from "./functions/Networking";
import { BehaviorEnum } from "./behaviors";

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
    (a) =>
      a.entity.behaviorId === BehaviorEnum.Player && a instanceof MoveAction
  );
  if (action) {
    state.undoState = UndoState.FinishPendingActions;
    state.undoActionId = action.id;
  }
}

export function handleRestart(
  state: EntityManagerState & RouterState & MetaState & ActionsState
) {
  if (state.isAtStart) return;

  const entitiesByServerId = [];
  for (const entity of state.entities) {
    if (ServerIdComponent.has(entity)) {
      entitiesByServerId[entity.serverId] = serializeEntity(entity);
    }
  }

  for (const entity of state.entities) {
    state.removeEntity(entity);
  }

  for (const entityData of Object.values(entitiesByServerId)) {
    const newEntity = deserializeEntity(state.addEntity(), entityData);
    state.addEntity(newEntity);
  }
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

export function handleSelectLevel(state: MetaState, newLevelId: string) {
  state.currentLevelId = Number(newLevelId);
}

export function toggleDevVarsForm(state: DevToolsState) {
  state.devToolsVarsFormEnabled = !state.devToolsVarsFormEnabled;
}

export function changeTimeScale(state: TimeState, value: string) {
  state.timeScale = Number(value);
}

export const inputHandlers = {
  handleRestart,
  handleRewind,
  handlePlay,
  handlePause,
  handleSignOut,
  handleSelectLevel,
  toggleDevVarsForm,
  changeTimeScale
} as Record<string, (state: any, value?: string) => void>;
