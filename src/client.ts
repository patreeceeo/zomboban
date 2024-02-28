import { handleRouteChange } from "./Router";
import { afterDOMContentLoaded } from "./util";
import { handleKeyDown, handleKeyUp } from "./Input";
import { SCREENX_PX, SCREENY_PX } from "./units/convert";
import { startFrameRhythms } from "./Rhythm";
import { OrthographicCamera, Scene, WebGLRenderer } from "three";
import { state } from "./newState";
import { TextureLoader } from "three";
import { SpriteComponent2 } from "./components";

// batchQueueImageLoading(IMAGES);

// registerBehaviorTypes();

startFrameRhythms();

function addEventListers() {
  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
  window.onhashchange = handleRouteChange;
  afterDOMContentLoaded(handleDomLoaded);
}

function handleDomLoaded() {
  const parentEl = document.getElementById("game")!;
  const renderer = new WebGLRenderer();
  renderer.setSize(SCREENX_PX, SCREENY_PX);
  renderer.setPixelRatio(4);
  // We want these to be set with CSS
  Object.assign(renderer.domElement.style, {
    width: "",
    height: "",
  });
  parentEl.appendChild(renderer.domElement);
  state.renderer = renderer;

  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  camera.zoom = Math.min(1 / SCREENX_PX, 1 / SCREENY_PX);
  camera.updateProjectionMatrix();
  state.camera = camera;

  state.scene = new Scene();

  const sprite = state.addEntity();
  const textureLoader = new TextureLoader();
  SpriteComponent2.add(sprite);
  if (SpriteComponent2.has(sprite)) {
    sprite.textureId = "assets/images/crate.gif";
    state.addTexture(
      sprite.textureId,
      textureLoader.load("assets/images/crate.gif"),
    );
    state.cameraTarget = sprite.position;
  }

  handleRouteChange();
}

if (import.meta.hot) {
  import.meta.hot.on("vite:error", (err) => {
    console.error(err);
  });
  import.meta.hot.dispose(() => {
    import.meta.hot!.data.loaded = true;
  });
  import.meta.hot.accept(() => {});
  if (!import.meta.hot!.data.loaded) {
    addEventListers();
  }
} else {
  addEventListers();
}
