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
import {
  ASSETS,
  BASE_URL,
  FONT_PATH,
  IMAGE_PATH,
  MODEL_PATH
} from "./constants";
import { AssetLoader } from "./AssetLoader";
import {
  Font,
  FontLoader,
  GLTF,
  GLTFLoader
} from "three/examples/jsm/Addons.js";
import { NearestFilter, Texture, TextureLoader, Vector2 } from "three";
import { BillboardEntity } from "./entities/BillboardEntity";
import { RenderSystem } from "./systems/RenderSystem";
import { FontOptions, TypewriterWriteOptions } from "./Typewritter";
import { AddedTag } from "./components";

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

  systemMgr.push(RenderSystem);

  const loadingMessageCursor = new Vector2();
  const loadingMessage = BillboardEntity.create(state);

  const loader = new AssetLoader(
    {
      [FONT_PATH]: FontLoader,
      [IMAGE_PATH]: TextureLoader,
      [MODEL_PATH]: GLTFLoader
    },
    BASE_URL
  );
  const writeOptions = new TypewriterWriteOptions(
    new FontOptions("helvetiker", 16, 3, 2, 0xffffff),
    loadingMessage.transform,
    loadingMessageCursor
  );

  const handleLoad = {
    [FONT_PATH]: (_id: string, result: Font, key: string) => {
      state.typewriter.addFont(key, result);
    },
    [MODEL_PATH]: (id: string, result: GLTF, _key: string) => {
      state.addModel(id, result.scene);
      state.typewriter.write(`Loaded ${id}\n`, writeOptions);
    },
    [IMAGE_PATH]: (id: string, result: Texture, _key: string) => {
      result.magFilter = NearestFilter;
      result.minFilter = NearestFilter;
      state.addTexture(id, result);
      state.typewriter.write(`Loaded ${id}\n`, writeOptions);
    }
  };

  await state.client.load(state);

  for (const [key, id] of Object.entries(ASSETS)) {
    const loaderId = loader.getLoaderId(id);
    const result = await loader.load(id);
    handleLoad[loaderId](id, result as any, key);
  }

  state.addBehavior(PlayerBehavior.id, new PlayerBehavior());
  state.addBehavior(BlockBehavior.id, new BlockBehavior());

  setTimeout(() => {
    AddedTag.remove(loadingMessage);
  }, 2000);

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
