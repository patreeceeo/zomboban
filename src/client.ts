import { handleRouteChange } from "./Router";
import { afterDOMContentLoaded } from "./util";
import { handleKeyDown, handleKeyUp } from "./Input";
import { state } from "./state";
import { SCREENX_PX, SCREENY_PX } from "./units/convert";
import { ANIMATIONS, IMAGES } from "./constants";
import { ReservedEntity } from "./entities";
import { batchQueueImageLoading } from "./functions/ImageLoading";
import { batchQueueAnimationLoading } from "./functions/AnimationLoading";
import { registerBehaviorTypes } from "./functions/Behavior";
import { startFrameRhythms } from "./Rhythm";
import { OrthographicCamera, Scene, WebGLRenderer } from "three";

// TODO delete this
const reservedEntities = [
  ReservedEntity.CAMERA,
  ReservedEntity.FLOOR_IMAGE,
  ReservedEntity.WALL_IMAGE,
  ReservedEntity.CRATE_IMAGE,
  ReservedEntity.PLAYER_DOWN_IMAGE,
  ReservedEntity.ZOMBIE_SWAY_ANIMATION,
  ReservedEntity.POTION_SPIN_ANIMATION,
  ReservedEntity.EDITOR_NORMAL_CURSOR_IMAGE,
  ReservedEntity.EDITOR_REPLACE_CURSOR_IMAGE,
  ReservedEntity.EDITOR_ORIENT_CURSOR_IMAGE,
  ReservedEntity.SCORE_TEXT,
  ReservedEntity.GUI_BUTTON_IMAGE,
  ReservedEntity.HAND_CURSOR_IMAGE,
];

for (const entity of reservedEntities) {
  state.addEntity(undefined, entity);
}

batchQueueImageLoading(IMAGES);

batchQueueAnimationLoading(ANIMATIONS);

registerBehaviorTypes();

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
