import { handleRouteChange } from "./Router";
import { afterDOMContentLoaded } from "./util";
import { handleKeyDown, handleKeyUp } from "./Input";
import { state } from "./state";
import { SCREENX_PX, SCREENY_PX } from "./units/convert";
import { Application } from "pixi.js";
import {
  ANIMATIONS,
  HAND_CURSOR_STYLE,
  HAND_TAP_CURSOR_STYLE,
  IMAGES,
} from "./constants";
import { ReservedEntity } from "./entities";
import { batchQueueImageLoading } from "./functions/ImageLoading";
import { batchQueueAnimationLoading } from "./functions/AnimationLoading";
import { registerBehaviorTypes } from "./functions/Behavior";
import { startFrameRhythms } from "./Rhythm";

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
  const app = new Application({
    width: SCREENX_PX,
    height: SCREENY_PX,
  });
  const { cursorStyles } = app.renderer.events;

  parentEl.appendChild(app.view as any);
  cursorStyles.default = HAND_CURSOR_STYLE;
  cursorStyles.pointer = HAND_CURSOR_STYLE;
  cursorStyles.tap = HAND_TAP_CURSOR_STYLE;

  addEventListener("mousedown", () => {
    app.renderer.events.setCursor("tap");
  });
  addEventListener("keydown", () => {
    app.renderer.events.setCursor("none");
  });
  app.stage.sortableChildren = true;
  state.pixiApp = app;

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
