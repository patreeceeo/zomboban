import { afterDOMContentLoaded } from "./util";
import { handleKeyDown, handleKeyUp } from "./Input";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  startFrameRhythms
} from "./Rhythm";
import { TextureLoader } from "three";
import { SpriteComponent2 } from "./components";
import { State } from "./state";
import { SystemManager } from "./System";
import { createRouterSystem } from "./systems/RouterSystem";
import { DEFAULT_ROUTE, ROUTES } from "./routes";

afterDOMContentLoaded(function handleDomLoaded() {
  const state = new State();
  const sprite = state.addEntity();
  const textureLoader = new TextureLoader();

  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;

  SpriteComponent2.add(sprite, {
    textureId: "assets/images/crate.gif"
  });
  if (SpriteComponent2.has(sprite)) {
    state.addTexture(sprite.textureId, textureLoader.load(sprite.textureId));
    state.cameraTarget.copy(sprite.position);
  }

  const systemMgr = new SystemManager();

  systemMgr.push(createRouterSystem(ROUTES, DEFAULT_ROUTE), state);

  addFrameRhythmCallback((dt, time) => {
    state.dt = dt;
    state.time = time;
    systemMgr.update(state);
  });
  addSteadyRhythmCallback(100, () => systemMgr.updateServices(state));
  startFrameRhythms();
});

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
