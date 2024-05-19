import { afterDOMContentLoaded, delay } from "./util";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  startFrameRhythms
} from "./Rhythm";
import {
  BehaviorCacheState,
  EntityManagerState,
  State,
  TimeState,
  TypewriterState
} from "./state";
import { SystemManager } from "./System";
import { createRouterSystem } from "./systems/RouterSystem";
import { DEFAULT_ROUTE, ROUTES } from "./routes";
import { PlayerBehavior } from "./entities/PlayerPrefab";
import { BlockBehavior } from "./entities/BlockEntity";
import { SignInForm, SignInFormOptions } from "./SignInForm";
import { ASSETS, BASE_URL, IMAGE_PATH, MODEL_PATH } from "./constants";
import { AssetLoader } from "./AssetLoader";
import {
  AmbientLight,
  DirectionalLight,
  NearestFilter,
  Texture,
  TextureLoader
} from "three";
import { BillboardEntity } from "./entities/BillboardEntity";
import { RenderSystem } from "./systems/RenderSystem";
import { AddedTag, ServerIdComponent, TransformComponent } from "./components";
import { GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";
import { ModelSystem } from "./systems/ModelSystem";
import { ITypewriterCursor } from "./Typewriter";
import { MonsterBehavior } from "./entities/MonsterEntity";
import * as COMPONENTS from "./components";
import { RoosterBehavior } from "./entities/RoosterEntity";

afterDOMContentLoaded(async function handleDomLoaded() {
  const state = new State();

  const systemMgr = new SystemManager(state);

  const loadingMessage = BillboardEntity.create(state);

  const loadingMessageCursor = loadingMessage.cursors.default;
  const cursors = {} as Record<string, ITypewriterCursor>;
  const writePromises = {} as Record<string, Promise<void>>;
  const loader = createAssetLoader();
  const assetIds = Object.values(ASSETS);

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

  for (const component of Object.values(COMPONENTS)) {
    state.registerComponent(component);
  }

  await state.client.load(state);

  systemMgr.clear();
  systemMgr.push(createRouterSystem(ROUTES, DEFAULT_ROUTE));

  await delay(3000);

  BillboardEntity.destroy(loadingMessage);
  state.removeEntity(loadingMessage);
});

declare const signInForm: HTMLFormElement;

afterDOMContentLoaded(function handleDomLoaded() {
  const formOptions = new SignInFormOptions(callback);
  const form = new SignInForm(signInForm, formOptions);

  (window as any).signIn = form.show.bind(form);

  async function callback(response: Response) {
    if (response.ok) {
      console.info("Sign in successful", response.status, response.statusText);
      form.hide();
    } else {
      console.info("Sign in failed", response.status, response.statusText);
    }
  }
});

(window as any).signOut = async () => {
  const response = await fetch("/logout", { method: "POST" });
  if (response.ok) {
    console.info("Sign out successful", response.status, response.statusText);
  } else {
    console.info("Sign out failed", response.status, response.statusText);
  }
};

function addStaticResources(state: BehaviorCacheState & TypewriterState) {
  state.addBehavior(PlayerBehavior.id, new PlayerBehavior());
  state.addBehavior(BlockBehavior.id, new BlockBehavior());
  state.addBehavior(MonsterBehavior.id, new MonsterBehavior());
  state.addBehavior(RoosterBehavior.id, new RoosterBehavior());
  // TODO add cursor behavior here
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

declare const timeScaleInput: HTMLInputElement;
function startLoops(state: TimeState, systemMgr: SystemManager<TimeState>) {
  addSteadyRhythmCallback(100, () => systemMgr.updateServices());
  timeScaleInput.onchange = () => {
    state.timeScale = parseFloat(timeScaleInput.value);
  };
  addFrameRhythmCallback((dt, time) => {
    const { timeScale } = state;
    state.dt = dt * timeScale;
    state.time = time * timeScale;
    systemMgr.update();
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
