import { ReservedEntity, reserveEntities } from "./entities";
import { handleKeyDown, handleKeyUp } from "./Input";
import { setPixiApp } from "./components/PixiApp";
import { ANIMATIONS, IMAGES } from "./constants";
import { batchQueueImageLoading } from "./functions/ImageLoading";
import { mountPixiApp } from "./systems/RenderSystem";
import { initCameraSystem } from "./systems/CameraSystem";
import { batchQueueAnimationLoading } from "./functions/AnimationLoading";
import { SCENE_MANAGER, SceneId } from "./scenes";

if (import.meta.hot) {
  import.meta.hot.accept("./constants", () => {});
}

export function startLoading(element: HTMLElement) {
  reserveEntities();

  batchQueueImageLoading(IMAGES);

  batchQueueAnimationLoading(ANIMATIONS);

  const app = mountPixiApp(element);

  setPixiApp(ReservedEntity.DEFAULT_PIXI_APP, app);
}

export async function startApp() {
  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
  initCameraSystem();
  await SCENE_MANAGER.start(SceneId.MAIN_MENU);
}

export function stopApp() {
  window.onkeydown = null;
  window.onkeyup = null;
}
