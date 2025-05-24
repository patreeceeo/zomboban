import { cookieStore } from "./cookie-store";
import { editorRoute, gameRoute, menuRoute } from "./routes";
import {
  ActionsState,
  CameraState,
  ClientState,
  DevToolsState,
  EntityManagerState,
  MetaState,
  RouterState,
  TimeState
} from "./state";
import { MAX_ZOOM, SESSION_COOKIE_NAME } from "./constants";
import { deserializeEntity } from "./functions/Networking";
import {signInEvent} from "./ui/events";
import {SignInFormController} from "./ui/my-sign-in-form";
import {IslandElement} from "Zui/Island";

export function handleToggleEditor(state: RouterState) {
  if (state.currentRoute.equals(gameRoute)) {
    editorRoute.follow();
  } else {
    gameRoute.follow();
  }
}

export function handleRestart(
  state: EntityManagerState & RouterState & MetaState & ActionsState
) {
  if (state.isAtStart) return;

  const { originalWorld } = state;

  for (const entity of state.entities) {
    state.removeEntity(entity);
  }

  for (const entityData of Object.values(originalWorld)) {
    const entity = deserializeEntity(state.addEntity(), entityData);
    state.addEntity(entity);
  }
}

export function handleRewind(state: ActionsState & TimeState) {
  state.isPaused = false;
}

export function handlePlay(state: ActionsState & TimeState) {
  state.isPaused = false;
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


const signInForm = document.querySelector(
  "my-sign-in-form"
) as IslandElement;

export function handleSignIn(state: ClientState) {
  (signInForm.controller as SignInFormController).open();
  signInEvent.receiveOn(signInForm, () => {
    state.isSignedIn = true;
  });
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

export function handleZoomIn(state: CameraState) {
  state.zoom = Math.min(state.zoom + 1, MAX_ZOOM);
}

export function handleZoomOut(state: CameraState) {
  state.zoom = Math.max(state.zoom - 1, 1);
}

export const inputHandlers = {
  handleRestart,
  handleRewind,
  handlePlay,
  handlePause,
  handleSignOut,
  handleSelectLevel,
  toggleDevVarsForm,
  changeTimeScale,
  handleSignIn,
  handleZoomIn,
  handleZoomOut,
} as Record<string, (state: any, value?: string) => void>;
