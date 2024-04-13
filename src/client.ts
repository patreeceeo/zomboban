import { afterDOMContentLoaded } from "./util";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  startFrameRhythms
} from "./Rhythm";
import { State } from "./state";
import { SystemManager } from "./System";
import { createRouterSystem } from "./systems/RouterSystem";
import { DEFAULT_ROUTE, ROUTES } from "./routes";
import { PlayerBehavior } from "./entities/PlayerPrefab";
import { BlockBehavior } from "./entities/BlockEntity";
import { SignInForm, SignInFormOptions } from "./SignInForm";
import { ASSETS, BASE_URL, IMAGE_PATH, MODEL_PATH } from "./constants";
import { AssetLoader } from "./AssetLoader";
import { AmbientLight, DirectionalLight } from "three";
import { BillboardEntity } from "./entities/BillboardEntity";
import { RenderSystem } from "./systems/RenderSystem";
import {
  FontOptions,
  ITypewriterCursor,
  TypewriterWriteOptions
} from "./Typewritter";
import { AddedTag, TransformComponent } from "./components";
import { ViewportSystem } from "./systems/ViewportSystem";
// import HelvetikarFont from "./static/fonts/helvetiker_regular.typeface.json";
import font from "./static/fonts/optimer_bold.typeface.json";
import { Font } from "three/examples/jsm/Addons.js";
import { getTextureLoader } from "./loaders/TextureLoader";
import { getGLTFLoader } from "./loaders/GLTFLoader";

afterDOMContentLoaded(async function handleDomLoaded() {
  const state = new State();

  const systemMgr = new SystemManager(state);

  addSteadyRhythmCallback(100, () => systemMgr.updateServices());
  addFrameRhythmCallback((dt, time) => {
    if (!isNaN(dt)) {
      state.dt += dt;
    }
    state.time = time;
    systemMgr.update();
    state.dt = 0;
  });
  startFrameRhythms();

  systemMgr.push(RenderSystem, ViewportSystem);

  const lights = state.addEntity();
  TransformComponent.add(lights);
  const { transform: lightTransform } = lights;
  AddedTag.add(lights);
  lightTransform.add(new DirectionalLight(0xffffff, 5));
  lightTransform.add(new AmbientLight(0xffffff, 2));
  lightTransform.position.set(0, -100, 595);
  lightTransform.lookAt(0, 0, 0);

  state.typewriter.addFont("helvetiker", new Font(font));
  const loadingMessage = BillboardEntity.create(state);
  loadingMessage.viewportTransform.position.set(16, 0);
  const loadingMessageCursor = state.typewriter.createCursor(
    new TypewriterWriteOptions(
      new FontOptions("helvetiker", 32, 3, 2, 0xffffff),
      loadingMessage.transform
    )
  );
  const cursors = {} as Record<string, ITypewriterCursor>;

  const loader = new AssetLoader(
    {
      [IMAGE_PATH]: getTextureLoader(state),
      [MODEL_PATH]: getGLTFLoader(state)
    },
    BASE_URL
  );

  const assetIds = Object.values(ASSETS);
  for (const id of assetIds) {
    const cursor = (cursors[id] = loadingMessageCursor.clone());
    cursor.write(`GET ${id}...  `);
    loadingMessageCursor.write(`\n`);
  }
  loader.onLoad((event) => cursors[event.id].write(`OK`));
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
  await Promise.all(assetIds.map((id) => loader.load(id)));
  await state.client.load(state);

  state.addBehavior(PlayerBehavior.id, new PlayerBehavior());
  state.addBehavior(BlockBehavior.id, new BlockBehavior());

  setTimeout(() => {
    BillboardEntity.destroy(loadingMessage);
    state.removeEntity(loadingMessage);
  }, 5000);

  systemMgr.clear();
  systemMgr.push(createRouterSystem(ROUTES, DEFAULT_ROUTE));
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
