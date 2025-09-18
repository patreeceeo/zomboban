import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  startFrameRhythms
} from "./Rhythm";
import { State } from "./state";
import { createRouterSystem, LoadingItem } from "./systems";
import { ROUTES, menuRoute, gameRoute, editorRoute } from "./routes";
import { BASE_URL } from "./constants";
import { IEntityPrefabState } from "./entities";
import "./polyfills";
import { FlashQueue } from "./ui/FlashQueue";
import { sessionCookie } from "./Cookie";
import htmx from "htmx.org";
import {camera, lights, registerInputHandlers, registerRouteSystems} from "./Zomboban";

console.log(`Client running in ${process.env.NODE_ENV} mode`);

declare const baseElement: HTMLBaseElement;
declare const canvas: HTMLCanvasElement;

const state = new State();
const rootElement = document.body;

state.render.canvas = canvas;

setupLoadingState(state);

baseElement.href = BASE_URL;

const { loadingItems } = state;

addStaticResources(state);

lights(state);
camera(state);

state.route.default = menuRoute;

// Register route-system mappings before creating router
registerRouteSystems();

state.systemManager.push(createRouterSystem(ROUTES, document));

loadingItems.add(new LoadingItem("entities", () => state.client.load(state)));

action(state);

htmx.onLoad((elt) => htmx.process(elt as any));

handleSessionCookie();

function addStaticResources(
  state: State & IEntityPrefabState
) {
  const { keyMapping } = state.input;

  registerInputHandlers(keyMapping);

}

declare const flashesElement: HTMLElement;
declare const loadingModal: HTMLDialogElement;
declare const mainMenuPlaceholder: HTMLDialogElement;

function action(
  state: State
) {
  const flashQueue = new FlashQueue(flashesElement);
  const { systemManager, time } = state;
  addSteadyRhythmCallback(100, () => systemManager.updateServices());
  addFrameRhythmCallback((dt) => {
    const { timeScale } = time;
    time.frameDelta = dt * timeScale;
    // NOTE: state.time.time is updated in ActionSystem
    systemManager.update();

    flashQueue.update(dt);

    const showLoadingModal = state.loadingItems.size > 0;

    if(showLoadingModal) {
      loadingModal.showModal();

      // Update loading progress and description
      const progressElement = document.getElementById('loadingProgress')! as HTMLProgressElement;
      const descriptionElement = document.getElementById('loadingDescription')!;

      progressElement.value = state.loadingProgress;
      descriptionElement.textContent = state.loadingGroupDescription ? ` ${state.loadingGroupDescription}` : '';
    } else {
      loadingModal.close();
    }

    // Control main menu modal
    const { current } = state.route;
    const showMainMenu = !showLoadingModal &&
      !(current.equals(gameRoute) || current.equals(editorRoute));

    if (showMainMenu) {
      mainMenuPlaceholder.showModal();
    } else {
      mainMenuPlaceholder.close();
    }
  });
  startFrameRhythms();
}


async function handleSessionCookie() {
  await sessionCookie.load();
  const sessionTimeRemaining = sessionCookie.expires - Date.now();
  state.isSignedIn = sessionTimeRemaining > 0;
  setTimeout(() => {
    state.isSignedIn = false;
  }, sessionTimeRemaining);
}

function setupLoadingState(state: State) {
  rootElement.addEventListener("htmx:beforeRequest", (evt) => {
    const xhr = (evt as any).detail.xhr as XMLHttpRequest;
    const _onload = xhr.onload;
    const item = new LoadingItem("hypertext", () => {
      return new Promise((resolve) => {
        xhr.onload = (progressEvt) => {
          resolve();
          if (_onload) {
            _onload.call(xhr, progressEvt);
          }
        };
      });
    });
    state.loadingItems.add(item);
  });
}
