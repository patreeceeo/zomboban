import { afterDOMContentLoaded, delay } from "./util";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  startFrameRhythms
} from "./Rhythm";
import {
  BehaviorState,
  EntityManagerState,
  InputState,
  QueryState,
  RouterState,
  State,
  TimeState
} from "./state";
import { SystemManager } from "./System";
import { createRouterSystem } from "./systems/RouterSystem";
import { DEFAULT_ROUTE, ROUTES } from "./routes";
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
import { ITypewriterCursor } from "./Typewriter";
import { MonsterBehavior, MonsterEntity } from "./entities/MonsterEntity";
import { RoosterBehavior, RoosterEntity } from "./entities/RoosterEntity";
import { WallBehavior, WallEntity } from "./entities/WallEntity";
import "./litComponents";
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
  handleToggleEditor,
  handleToggleMenu,
  handleUndo
} from "./inputs";
import "./polyfills";
import "htmx.org";
import { RequestIndicator } from "./ui/RequestIndicator";
import { FlashQueue } from "./ui/FlashQueue";
import { invariant } from "./Error";

declare const requestIndicatorElement: HTMLDialogElement;

console.log(`Client running in ${process.env.NODE_ENV} mode`);

if (import.meta.hot) {
  import.meta.hot.on("html-update", (event) => {
    const elt = document.querySelector(`[hx-get="${event.id}"]`);
    invariant(
      elt instanceof HTMLElement,
      `Couldn't find element that requests the ${event.id} partial`
    );
    elt.innerHTML = event.content;
  });
}

document.body.addEventListener("htmx:load", () => {
  if (process.env.NODE_ENV === "development") {
    loadDevTools();
  }
});

afterDOMContentLoaded(async function handleDomLoaded() {
  const state = new State();

  const systemMgr = new SystemManager(state);

  const loadingMessageCursor = state.typewriter.createCursor();
  const cursors = {} as Record<string, ITypewriterCursor>;
  const writePromises = {} as Record<string, Promise<void>>;
  const loader = createAssetLoader();
  const assetIds = Object.values(ASSET_IDS);

  const requestIndicator = new RequestIndicator(requestIndicatorElement);

  requestIndicator.open();

  const openRequestIndicator = (message: string) => {
    requestIndicator.message = message;
    requestIndicator.open();
  };
  const closeRequestIndicator = () => requestIndicator.close();
  document.body.addEventListener("htmx:beforeRequest", () =>
    requestIndicator.open()
  );
  state.onRequestStart(openRequestIndicator);
  document.body.addEventListener("htmx:afterRequest", closeRequestIndicator);
  state.onRequestEnd(closeRequestIndicator);

  addStaticResources(state);

  startLoops(state, systemMgr);

  lights(state);
  systemMgr.push(RenderSystem, ModelSystem);

  for (const id of assetIds) {
    const cursor = (cursors[id] = loadingMessageCursor.clone());
    writePromises[id] = cursor.writeAsync(`GET ${id}...  `);
    loadingMessageCursor.writeAsync(`\n`);
  }
  loader.onLoad(async (event) => {
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
    await writePromises[assetId];
    cursors[assetId].writeAsync(`OK`);
  });
  state.client.onGetStart((id) => {
    const cursorId = `entity/${id}`;
    const cursor = (cursors[cursorId] = loadingMessageCursor.clone());
    loadingMessageCursor.writeAsync(`\n`);
    writePromises[cursorId] = cursor.writeAsync(`GET entity/${id}...  `);
  });
  state.client.onGet(async (entity) => {
    const cursorId = `entity/${entity.serverId}`;
    await writePromises[cursorId];
    cursors[cursorId].writeAsync(
      `OK. ${"behaviorId" in entity && typeof entity.behaviorId === "string" ? entity.behaviorId.split("/").pop() : ""}`
    );
  });

  await loadAssets(loader, assetIds);

  ServerIdComponent.onDeserialize(
    (data) => (state.originalWorld[data.serverId] = data)
  );

  registerComponents(state);

  await state.client.load(state);

  systemMgr.clear();
  systemMgr.push(createRouterSystem(ROUTES, DEFAULT_ROUTE));

  requestIndicator.close();

  await delay(3000);

  loadingMessageCursor.destroy();
});

if (process.env.NODE_ENV === "production") {
  window.onbeforeunload = (event) => {
    event.preventDefault();
    return true;
  };
}

(window as any).signOut = async () => {
  const response = await fetch("/logout", { method: "POST" });
  if (response.ok) {
    console.info("Sign out successful", response.status, response.statusText);
  } else {
    console.info("Sign out failed", response.status, response.statusText);
  }
};

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

function startLoops(state: TimeState, systemMgr: SystemManager<TimeState>) {
  const flashQueue = new FlashQueue(flashesElement);
  addSteadyRhythmCallback(100, () => systemMgr.updateServices());
  addFrameRhythmCallback((dt) => {
    const { timeScale } = state;
    state.dt = dt * timeScale;
    // NOTE: state.time is updated in ActionSystem
    systemMgr.update();

    flashQueue.update(dt);
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

declare const devtoolsElement: HTMLElement;
function loadDevTools() {
  if (devtoolsElement.children.length === 0) {
    devtoolsElement.dispatchEvent(new CustomEvent("get"));
  }
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
