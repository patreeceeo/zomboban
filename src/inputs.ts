import { cookieStore } from "./cookie-store";
import { editorRoute, gameRoute, menuRoute } from "./routes";
import {
  ActionsState,
  ClientState,
  DebugState,
  DevToolsState,
  MetaState,
  Mode,
  RouterState,
  State,
  TimeState,
  InputState
} from "./state";
import { SESSION_COOKIE_NAME } from "./constants";
import {signInEvent} from "./ui/events";
import {SignInFormController} from "./ui/my-sign-in-form";
import {IslandElement} from "Zui/Island";
import {EditorSystem} from "./systems/EditorSystem";

export function handleToggleEditor(state: RouterState) {
  if (state.currentRoute.equals(gameRoute)) {
    editorRoute.follow();
  } else {
    gameRoute.follow();
  }
}

export async function handleRestart(
  state: State
) {
  if (state.isAtStart) return;

  state.isPaused = true;

  for (const entity of state.dynamicEntities) {
    state.removeEntity(entity);
  }

  await state.client.load(state)
  state.isPaused = false;
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


export function handleSignIn(state: ClientState) {
  const signInForm = document.querySelector(
    "my-sign-in-form"
  ) as IslandElement;

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

export function handleZoomIn(state: InputState) {
  state.zoomControl.zoom++
}

export function handleZoomOut(state: InputState) {
  state.zoomControl.zoom--;
}

// TODO move to editor system
export function handleEditorUndo(state: State) {
  if(state.mode === Mode.Edit) {
    EditorSystem.undo(state);
  }
}

// TODO move to editor system
export function handleEditorRedo(state: State) {
  if(state.mode === Mode.Edit) {
    EditorSystem.redo(state);
  }
}

export function decreaseTimeScale(
  state: TimeState,
) {
  state.timeScale = Math.max(0.1, state.timeScale - 0.1);
}

export function increaseTimeScale(
  state: TimeState,
) {
  state.timeScale = Math.min(2, state.timeScale + 0.1);
}

export function toggleDebugTiles(state: DebugState) {
  state.debugTilesEnabled = !state.debugTilesEnabled;
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
  toggleDebugTiles,
} as Record<string, (state: any, value?: string) => void>;
