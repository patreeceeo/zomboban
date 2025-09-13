import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  startFrameRhythms
} from "./Rhythm";
import { State } from "./state";
import { createRouterSystem, LoadingItem } from "./systems";
import { ROUTES, editorRoute, gameRoute, menuRoute } from "./routes";
import { BASE_URL } from "./constants";
import { IEntityPrefabState } from "./entities";
import {
  handleSignOut,
  inputHandlers,
} from "./inputs";
import "./polyfills";
import { FlashQueue } from "./ui/FlashQueue";
import islands from "./islands";
import { Zui } from "./Zui";
import { sessionCookie } from "./Cookie";
import { delegateEventType } from "Zui/events";
import { invariant } from "./Error";
import htmx from "htmx.org";
import { signOutEvent } from "./ui/events";
import {camera, lights, registerInputHandlers, registerRouteSystems} from "./Zomboban";

console.log(`Client running in ${process.env.NODE_ENV} mode`);

declare const baseElement: HTMLBaseElement;
declare const canvas: HTMLCanvasElement;

const state = new State();

state.render.canvas = canvas;

const rootElement = document.body;
const zui = new Zui(rootElement, { islands, scope: state });

setupLoadingState(state);

baseElement.href = BASE_URL;

zui.ready().then(async () => {
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

});

function addStaticResources(
  state: State & IEntityPrefabState
) {
  const { keyMapping } = state.input;

  registerInputHandlers(keyMapping);

  delegateEventType.receiveOn(zui.root, ({ detail: methodName, target }) => {
    invariant(
      methodName in inputHandlers,
      `No input handler for ${methodName}`
    );
    const handler = inputHandlers[methodName as keyof typeof inputHandlers];
    if (handler.length === 2 && target !== null && "value" in target) {
      handler(state, target.value as string);
    } else {
      handler(state as any);
    }
  });

  signOutEvent.receiveOn(zui.root, () => handleSignOut(state as any));
}

declare const flashesElement: HTMLElement;

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
    zui.update();

    const { current } = state.route;
    state.showModal =
      state.loadingItems.size > 0 ||
      !(current.equals(gameRoute) || current.equals(editorRoute));
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
