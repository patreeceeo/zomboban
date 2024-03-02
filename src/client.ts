import { IRouteRecord, handleRouteChange } from "./Router";
import { afterDOMContentLoaded } from "./util";
import { handleKeyDown, handleKeyUp } from "./Input";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  startFrameRhythms
} from "./Rhythm";
import { Scene } from "three";
import { TextureLoader } from "three";
import { SpriteComponent2 } from "./components";
import { RouteId } from "./routes";
import { State } from "./state";
import { System, SystemManager } from "./System";
import { CameraSystem } from "./systems/CameraSystem";
import { RenderSystem, createRenderer } from "./systems/RenderSystem";

class GameSystem extends System<State> {
  start(context: State) {
    this.mgr.push(CameraSystem, context);
    this.mgr.push(RenderSystem, context);
  }
}

const DEFAULT_ROUTE = RouteId.GAME;

afterDOMContentLoaded(function handleDomLoaded() {
  const state = new State();
  // TODO move this to render system
  state.scene = new Scene();
  state.renderer = createRenderer();

  const sprite = state.addEntity();
  const textureLoader = new TextureLoader();
  SpriteComponent2.add(sprite, {
    textureId: "assets/images/crate.gif"
  });
  if (SpriteComponent2.has(sprite)) {
    state.addTexture(sprite.textureId, textureLoader.load(sprite.textureId));
    state.cameraTarget.copy(sprite.position);
  }

  const systemMgr = new SystemManager();
  addFrameRhythmCallback(() => systemMgr.update(state));
  addSteadyRhythmCallback(100, () => systemMgr.updateServices());

  const ROUTES: IRouteRecord = {
    [RouteId.GAME]: (query) => {
      systemMgr.push(GameSystem, state);
      void query;
      // if (query.has("world")) {
      //   const worldId = parseInt(query.get("world")!);
      //   stateOld.loadWorld(worldId);
      // }
    }
  };

  handleRouteChange(ROUTES, DEFAULT_ROUTE);
  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
  window.onhashchange = () => handleRouteChange(ROUTES, DEFAULT_ROUTE);
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
