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
  QueryState,
  RouterState,
  State,
  TimeState
} from "./state";
import { SystemManager } from "./System";
import { createRouterSystem } from "./systems/RouterSystem";
import { ROUTES } from "./routes";
import { PlayerBehavior, PlayerEntity } from "./entities/PlayerPrefab";
import { BlockBehavior, BlockEntity } from "./entities/BlockEntity";
import { BASE_URL, KEY_MAPS } from "./constants";
import { ASSET_IDS, IMAGE_PATH, MODEL_PATH } from "./assets";
import { AssetLoader } from "./AssetLoader";
import {
  AmbientLight,
  DirectionalLight,
  NearestFilter,
  Texture,
  TextureLoader
} from "three";
import { RenderSystem } from "./systems/RenderSystem";
import {
  AddedTag,
  BehaviorComponent,
  ServerIdComponent,
  ToggleableComponent,
  TransformComponent
} from "./components";
import { GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";
import { ModelSystem } from "./systems/ModelSystem";
import { MonsterBehavior, MonsterEntity } from "./entities/MonsterEntity";
import { RoosterBehavior, RoosterEntity } from "./entities/RoosterEntity";
import { WallBehavior, WallEntity } from "./entities/WallEntity";
import { registerComponents } from "./common";
import {
  ToggleButtonBehavior,
  ToggleButtonEntity
} from "./entities/ToggleButtonEntity";
import { ToggleWallBehavior, ToggleWallEntity } from "./entities/ToggleWall";
import { IPrefabEntityState, PrefabEntity } from "./entities";
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
import { RequestIndicator } from "./ui/RequestIndicator";
import { FlashQueue } from "./ui/FlashQueue";
import islands from "./islands";
import { Zui } from "./Zui";
import { IslandElement } from "./Zui/Island";
import { sessionCookie } from "./Cookie";
import { delegateEventType } from "Zui/events";
import { invariant } from "./Error";
import htmx from "htmx.org";
import { hmrReloadTemplateEvent, signOutEvent } from "./ui/events";

declare const requestIndicatorElement: HTMLDialogElement;

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
const requestIndicator = new RequestIndicator(requestIndicatorElement);

setupRequestIndicator(requestIndicator);

zui.ready().then(async () => {
  zui.update();

  const systemMgr = new SystemManager(state);

  htmx.onLoad((elt) => htmx.process(elt as any));

  addStaticResources(state);

  startLoops(state, systemMgr);

  lights(state);

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
  await loadAssets(loader, assetIds);

  ServerIdComponent.onDeserialize(
    (data) => (state.originalWorld[data.serverId] = data)
  );

  registerComponents(state);

  await state.client.load(state);

  requestIndicator.requestCount = 0;

  systemMgr.push(createRouterSystem(ROUTES));

  handleSessionCookie();

  await delay(3000);
});

function addStaticResources(
  state: BehaviorState &
    QueryState &
    IPrefabEntityState &
    RouterState &
    InputState
) {
  const toggleableQuery = state.query([ToggleableComponent, BehaviorComponent]);
  const { prefabEntityMap, registeredSystems, keyMapping } = state;
  state.addBehavior(PlayerBehavior.id, new PlayerBehavior());
  state.addBehavior(BlockBehavior.id, new BlockBehavior());
  state.addBehavior(MonsterBehavior.id, new MonsterBehavior());
  state.addBehavior(RoosterBehavior.id, new RoosterBehavior());
  state.addBehavior(WallBehavior.id, new WallBehavior());
  state.addBehavior(
    ToggleButtonBehavior.id,
    new ToggleButtonBehavior(toggleableQuery)
  );
  state.addBehavior(ToggleWallBehavior.id, new ToggleWallBehavior());
  // TODO add cursor behavior here

  for (const [key, prefeb] of [
    [PrefabEntity.Block, BlockEntity],
    [PrefabEntity.Monster, MonsterEntity],
    [PrefabEntity.Player, PlayerEntity],
    [PrefabEntity.Rooster, RoosterEntity],
    [PrefabEntity.ToggleButton, ToggleButtonEntity],
    [PrefabEntity.ToggleWall, ToggleWallEntity],
    [PrefabEntity.Wall, WallEntity]
  ] as const) {
    prefabEntityMap.set(key, prefeb);
  }

  for (const [key, system] of [
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

  delegateEventType.receiveOn(zui.root, ({ detail: { methodName } }) => {
    invariant(
      methodName in inputHandlers,
      `No input handler for ${methodName}`
    );
    inputHandlers[methodName as keyof typeof inputHandlers](state as any);
  });

  signOutEvent.receiveOn(zui.root, () => handleSignOut(state as any));
}

function createAssetLoader() {
  const loader = new AssetLoader(
    {
      [IMAGE_PATH]: TextureLoader,
      [MODEL_PATH]: GLTFLoader
    },
    BASE_URL
  );

  return loader;
}

async function loadAssets(loader: AssetLoader<any>, assetIds: string[]) {
  await Promise.all(assetIds.map((id) => loader.load(id)));
}

declare const flashesElement: HTMLElement;

function startLoops(
  state: TimeState & ClientState,
  systemMgr: SystemManager<TimeState>
) {
  const flashQueue = new FlashQueue(flashesElement);
  addSteadyRhythmCallback(100, () => systemMgr.updateServices());
  addFrameRhythmCallback((dt) => {
    const { timeScale } = state;
    state.dt = dt * timeScale;
    // NOTE: state.time is updated in ActionSystem
    systemMgr.update();

    flashQueue.update(dt);
    zui.update();
  });
  startFrameRhythms();
}

function lights(state: EntityManagerState) {
  const lights = state.addEntity();
  TransformComponent.add(lights);
  const { transform: lightTransform } = lights;
  AddedTag.add(lights);
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

function setupRequestIndicator(requestIndicator: RequestIndicator) {
  const decrimentRequestIndicatorCount = () => {
    requestIndicator.requestCount -= 1;
  };
  requestIndicator.requestCount = 10; // idk

  for (const _ of assetIds) {
    requestIndicator.requestCount += 1;
  }
  rootElement.addEventListener("htmx:beforeRequest", () => {
    requestIndicator.message = "loading template";
    requestIndicator.requestCount += 1;
  });
  state.onRequestStart(() => {
    requestIndicator.message = "saving level data";
    requestIndicator.requestCount += 1;
  });
  rootElement.addEventListener(
    "htmx:afterRequest",
    decrimentRequestIndicatorCount
  );
  state.onRequestEnd(decrimentRequestIndicatorCount);
  loader.onLoad(() => {
    requestIndicator.requestCount -= 1;
  });
  state.client.onGetStart((id) => {
    requestIndicator.message = `GET entity/${id}`;
    requestIndicator.requestCount += 1;
  });
  state.client.onGet(() => {
    requestIndicator.requestCount -= 1;
  });
}

// if (import.meta.hot) {
//   import.meta.hot.on("vite:error", (err) => {
//     console.error(err);
//   });
//   import.meta.hot.dispose(() => {
//     import.meta.hot!.data.loaded = true;
//   });
//   import.meta.hot.accept(() => {});
//   if (!import.meta.hot!.data.loaded) {
//     addEventListers();
//   }
// } else {
//   addEventListers();
// }
