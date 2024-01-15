import { ReservedEntity, reserveEntities } from "./entities";
import { handleKeyDown, handleKeyUp } from "./Input";
import { setPixiApp } from "./components/PixiApp";
import { ANIMATIONS, IMAGES } from "./constants";
import { batchQueueImageLoading } from "./functions/ImageLoading";
import { mountPixiApp } from "./systems/RenderSystem";
import { initCameraSystem } from "./systems/CameraSystem";
import { batchQueueAnimationLoading } from "./functions/AnimationLoading";
import { SCENE_MANAGER, SceneId } from "./scenes";
import { loadComponents } from "./Component";
import { EditorScene } from "./scenes/EditorScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";

if (import.meta.hot) {
  import.meta.hot.accept("./constants", () => {});
}

export function startLoading(element: HTMLElement) {
  reserveEntities();

  batchQueueImageLoading(IMAGES);

  batchQueueAnimationLoading(ANIMATIONS);

  const app = mountPixiApp(element);

  setPixiApp(ReservedEntity.DEFAULT_PIXI_APP, app);

  SCENE_MANAGER.registerScene(new EditorScene(), SceneId.EDITOR);
  SCENE_MANAGER.registerScene(new GameScene(), SceneId.GAME);
  SCENE_MANAGER.registerScene(new GameOverScene(), SceneId.GAME_OVER);
}

export function startApp() {
  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
  initCameraSystem();
  SCENE_MANAGER.start(SceneId.EDITOR);
  loadComponents();
}

export function stopApp() {
  window.onkeydown = null;
  window.onkeyup = null;
}
