import { afterDOMContentLoaded, delay } from "./util";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  startFrameRhythms
} from "./Rhythm";
import {
  BehaviorCacheState,
  EntityManagerState,
  InputState,
  RendererState,
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
import { ITypewriterCursor } from "./Typewriter";
import {
  AddedTag,
  BehaviorComponent,
  InputReceiverTag,
  IsActiveTag,
  TransformComponent
} from "./components";
import { ViewportSystem } from "./systems/ViewportSystem";
import { Font, GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";
import { TutorialScript } from "./scripts/Tutorial";
import font from "./static/fonts/optimer_bold.typeface.json";

afterDOMContentLoaded(async function handleDomLoaded() {
  const state = new State();

  const systemMgr = new SystemManager(state);

  const loadingMessage = BillboardEntity.create(state);

  const loadingMessageCursor = loadingMessage.cursors.default;
  const cursors = {} as Record<string, ITypewriterCursor>;
  const loader = createAssetLoader();
  const assetIds = Object.values(ASSETS);

  addStaticResources(state);

  startLoops(state, systemMgr);

  lights(state);
  systemMgr.push(RenderSystem, ViewportSystem);

  for (const id of assetIds) {
    const cursor = (cursors[id] = loadingMessageCursor.clone());
    cursor.write(`GET ${id}...  `);
    loadingMessageCursor.write(`\n`);
  }
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
      state.addModel(event.id, gltf.scene);
    }
    cursors[assetId].write(`OK`);
  });
  state.client.onGetStart((id) => {
    const cursor = (cursors[`entity/${id}`] = loadingMessageCursor.clone());
    loadingMessageCursor.write(`\n`);
    cursor.write(`GET entity/${id}...  `);
  });
  state.client.onGet((entity) => {
    cursors[`entity/${entity.serverId}`].write(
      `OK. ${"behaviorId" in entity && typeof entity.behaviorId === "string" ? entity.behaviorId.split("/").pop() : ""}`
    );
  });
  await loadAssets(loader, assetIds);
  await state.client.load(state);

  systemMgr.clear();
  systemMgr.push(createRouterSystem(ROUTES, DEFAULT_ROUTE));

  await delay(3000);

  BillboardEntity.destroy(loadingMessage);
  state.removeEntity(loadingMessage);

  await intro(state);

  help(state);
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
  state.addBehavior(TutorialScript.id, new TutorialScript());
  // TODO add cursor behavior here
  state.typewriter.addFont("optimer", new Font(font));
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

function startLoops(state: TimeState, systemMgr: SystemManager<TimeState>) {
  addSteadyRhythmCallback(100, () => systemMgr.updateServices());
  addFrameRhythmCallback((dt, time) => {
    state.dt += dt;
    state.time = time;
    systemMgr.update();
    state.dt = 0;
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

const INTRO_TEXT = `Welcome to the demo!
Many seeds have been planted here.
Almost as many have yet to break the surface.
Time is an ellusive partner in this project.
Check back soon for more updates!
`;

async function intro(
  state: RendererState & EntityManagerState & TypewriterState & InputState
) {
  const introMessage = BillboardEntity.create(state);
  introMessage.cursors.default.write(INTRO_TEXT);
  state.forceRender = true;

  await delay(10000);

  BillboardEntity.destroy(introMessage);
  state.removeEntity(introMessage);
}

async function help(
  state: RendererState & EntityManagerState & TypewriterState & InputState
) {
  const helpMessage = BillboardEntity.create(state);
  BehaviorComponent.add(helpMessage, { behaviorId: TutorialScript.id });
  IsActiveTag.add(helpMessage);
  InputReceiverTag.add(helpMessage);
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
