import { delay } from "./util";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  startFrameRhythms
} from "./Rhythm";
import {
  BehaviorState,
  ClientState,
  EntityManagerState,
  InputState,
  LoadingState,
  QueryState,
  RouterState,
  State,
  TimeState
} from "./state";
import { createRouterSystem } from "./systems/RouterSystem";
import { ROUTES, editorRoute, gameRoute, menuRoute } from "./routes";
import { BASE_URL, KEY_MAPS, PAUSE_MENU_TIMEOUT } from "./constants";
import { ASSET_IDS, IMAGE_PATH, MODEL_PATH } from "./assets";
import { AssetLoader } from "./AssetLoader";
import {
  AmbientLight,
  DirectionalLight,
  NearestFilter,
  Texture,
  TextureLoader,
  GLTF
} from "./Three";
import { GLTFLoader } from "./GLTFLoader";
import { RenderSystem } from "./systems/RenderSystem";
import {
  InSceneTag,
  ServerIdComponent,
  TransformComponent
} from "./components";
import { ModelSystem } from "./systems/ModelSystem";
import { registerComponents } from "./common";
import { IEntityPrefabState } from "./entities";
import { SystemEnum } from "./systems";
import { ActionSystem } from "./systems/ActionSystem";
import { AnimationSystem } from "./systems/AnimationSystem";
import { BehaviorSystem } from "./systems/BehaviorSystem";
import { CameraSystem } from "./systems/CameraSystem";
import { ClientSystem } from "./systems/ClientSystem";
import { EditorSystem } from "./systems/EditorSystem";
import { GameSystem } from "./systems/GameSystem";
import { InputSystem } from "./systems/InputSystem";
import { TileSystem } from "./systems/TileSystem";
import {
  handleRestart,
  handleSignOut,
  handleToggleEditor,
  handleToggleMenu,
  handleUndo,
  inputHandlers
} from "./inputs";
import "./polyfills";
import { FlashQueue } from "./ui/FlashQueue";
import islands from "./islands";
import { Zui } from "./Zui";
import { IslandElement } from "./Zui/Island";
import { sessionCookie } from "./Cookie";
import { delegateEventType } from "Zui/events";
import { invariant } from "./Error";
import htmx from "htmx.org";
import { hmrReloadTemplateEvent, signOutEvent } from "./ui/events";
import { SceneManagerSystem } from "./systems/SceneManagerSystem";
import { LoadingItem, LoadingSystem } from "./systems/LoadingSystem";

declare const baseElement: HTMLBaseElement;

if (import.meta.hot) {
  import.meta.hot.on(
    "html-update",
    async (event: { id: string; content: string }) => {
      const elt = document.querySelector(
        `[template="${event.id}"]`
      ) as IslandElement;
      if (elt instanceof HTMLElement) {
        elt.innerHTML = event.content;
        // allow the browser to process the new HTML;
        await delay(20);
        // TODO find a way to hold on to the existing controller instance
        await elt.hydrate();
        hmrReloadTemplateEvent.trigger(elt);
      }
    }
  );
}

console.log(`Client running in ${process.env.NODE_ENV} mode`);

const state = new State();
const rootElement = document.body;
const zui = new Zui(rootElement, { islands, scope: state });
const loader = createAssetLoader();
const assetIds = Object.values(ASSET_IDS);

setupLoadingState(state);

baseElement.href = BASE_URL;

zui.ready().then(async () => {
  const { loadingItems } = state;

  addStaticResources(state);

  state.systemManager.push(createRouterSystem(ROUTES));

  zui.update();

  htmx.onLoad((elt) => htmx.process(elt as any));

  startLoops(state);

  lights(state);

  loadingItems.add(
    new LoadingItem("assets", () => loadAssets(loader, assetIds))
  );

  loadingItems.add(new LoadingItem("entities", () => state.client.load(state)));

  ServerIdComponent.onDeserialize(
    (data) => (state.originalWorld[data.serverId] = data)
  );

  registerComponents(state);

  handleSessionCookie();
});

function addStaticResources(
  state: BehaviorState &
    QueryState &
    IEntityPrefabState &
    RouterState &
    InputState
) {
  const { registeredSystems, keyMapping } = state;

  for (const [key, system] of [
    [SystemEnum.Loading, LoadingSystem],
    [SystemEnum.SceneManager, SceneManagerSystem],
    [SystemEnum.Action, ActionSystem],
    [SystemEnum.Animation, AnimationSystem],
    [SystemEnum.Behavior, BehaviorSystem],
    [SystemEnum.Camera, CameraSystem],
    [SystemEnum.Client, ClientSystem],
    [SystemEnum.Editor, EditorSystem],
    [SystemEnum.Game, GameSystem],
    [SystemEnum.Input, InputSystem],
    [SystemEnum.Model, ModelSystem],
    [SystemEnum.Render, RenderSystem],
    [SystemEnum.Tile, TileSystem]
  ] as const) {
    registeredSystems.set(key, system);
  }

  for (const [key, handler] of [
    [KEY_MAPS.TOGGLE_MENU, handleToggleMenu],
    [KEY_MAPS.TOGGLE_EDITOR, handleToggleEditor],
    [KEY_MAPS.UNDO, handleUndo],
    [KEY_MAPS.RESTART, handleRestart]
  ] as const) {
    keyMapping.set(key, handler);
  }

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

function createAssetLoader() {
  const loader = new AssetLoader(
    {
      [IMAGE_PATH]: TextureLoader,
      // Typescript WTF
      [MODEL_PATH]: GLTFLoader as any
    },
    BASE_URL
  );

  return loader;
}

async function loadAssets(loader: AssetLoader<any>, assetIds: string[]) {
  loader.onLoad((event) => {
    const assetId = event.id;
    if (assetId.startsWith(IMAGE_PATH)) {
      const texture = event.asset as Texture;
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      state.addTexture(event.id, event.asset);
    }
    if (assetId.startsWith(MODEL_PATH)) {
      const gltf = event.asset as GLTF;
      state.addModel(event.id, gltf);
    }
  });
  await Promise.all(assetIds.map((id) => loader.load(id)));
}

declare const flashesElement: HTMLElement;

function startLoops(
  state: TimeState & ClientState & InputState & RouterState & LoadingState
) {
  const flashQueue = new FlashQueue(flashesElement);
  const { systemManager } = state;
  addSteadyRhythmCallback(100, () => systemManager.updateServices());
  addFrameRhythmCallback((dt) => {
    const { timeScale } = state;
    state.dt = dt * timeScale;
    // NOTE: state.time is updated in ActionSystem
    systemManager.update();

    flashQueue.update(dt);
    zui.update();

    if (
      state.time - state.inputTime > PAUSE_MENU_TIMEOUT &&
      !menuRoute.test(location)
    ) {
      menuRoute.follow();
    }

    const { currentRoute } = state;
    state.showModal =
      state.loadingItems.size > 0 ||
      !(currentRoute.equals(gameRoute) || currentRoute.equals(editorRoute));
  });
  startFrameRhythms();
}

function lights(state: EntityManagerState) {
  const lights = state.addEntity();
  TransformComponent.add(lights);
  const { transform: lightTransform } = lights;
  InSceneTag.add(lights);
  lightTransform.add(new DirectionalLight(0xffffff, 5));
  lightTransform.add(new AmbientLight(0xffffff, 2));
  lightTransform.position.set(0, -100, 595);
  lightTransform.lookAt(0, 0, 0);
}

async function handleSessionCookie() {
  await sessionCookie.load();
  const sessionTimeRemaining = sessionCookie.expires - Date.now();
  state.isSignedIn = sessionTimeRemaining > 0;
  setTimeout(() => {
    state.isSignedIn = false;
  }, sessionTimeRemaining);
}

function setupLoadingState(state: LoadingState) {
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
