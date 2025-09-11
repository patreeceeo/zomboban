import { cookieStore } from "./cookie-store";
import { editorRoute, gameRoute, menuRoute } from "./routes";
import {
  ActionsState,
  ClientState,
  DebugState,
  MetaState,
  Mode,
  State
} from "./state";
import { SESSION_COOKIE_NAME } from "./constants";
import {signInEvent} from "./ui/events";
import {SignInFormController} from "./ui/my-sign-in-form";
import {IslandElement} from "Zui/Island";
import {EditorSystem} from "./systems/EditorSystem";

export function handleToggleEditor(state: State) {
  if (state.route.current.equals(gameRoute)) {
    state.route.current = editorRoute;
  } else {
    state.route.current = gameRoute;
  }
}

export async function handleRestart(
  state: State
) {
  if (state.isAtStart) return;

  state.time.isPaused = true;

  for (const entity of state.dynamicEntities) {
    state.world.removeEntity(entity);
  }

  await state.client.load(state)
  state.time.isPaused = false;
}

export function handleRewind(state: ActionsState & State) {
  state.time.isPaused = false;
}

export function handlePlay(state: ActionsState & State) {
  state.time.isPaused = false;
}

export function handlePause(state: ActionsState & State) {
  state.time.isPaused = true;
}

export function handleShowMenu(state: State) {
  state.route.current = menuRoute;
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

export function toggleDevVarsForm(state: State) {
  state.devTools.varsFormEnabled = !state.devTools.varsFormEnabled;
}

export function changeTimeScale(state: State, value: string) {
  state.time.timeScale = Number(value);
}

export function handleZoomIn(state: State) {
  state.zoomControl.zoom++
}

export function handleZoomOut(state: State) {
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
  state: State,
) {
  state.time.timeScale = Math.max(0.1, state.time.timeScale - 0.1);
}

export function increaseTimeScale(
  state: State,
) {
  state.time.timeScale = Math.min(2, state.time.timeScale + 0.1);
}

export function toggleDebugTiles(state: DebugState) {
  state.debugTilesEnabled = !state.debugTilesEnabled;
}

export function handleToggleDevTools(state: State) {
  state.devTools.isOpen = !state.devTools.isOpen;
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
  handleShowMenu,
  handleToggleDevTools,
} as Record<string, (state: any, value?: string) => void>;
