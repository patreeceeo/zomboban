import { ReservedEntity, reserveEntities } from "./entities";
import { handleKeyDown, handleKeyUp } from "./Input";
import { setPixiApp } from "./components/PixiApp";
import { ANIMATIONS, IMAGES } from "./constants";
import { batchQueueImageLoading } from "./functions/ImageLoading";
import { mountPixiApp } from "./systems/RenderSystem";
import { initCameraSystem } from "./systems/CameraSystem";
import { batchQueueAnimationLoading } from "./functions/AnimationLoading";
import { SCENE_MANAGER, SceneId } from "./scenes";
import { loadComponents } from "./ComponentData";
import { EditorScene } from "./scenes/EditorScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";

export function startLoading(element: HTMLElement) {
  reserveEntities();

  batchQueueImageLoading(IMAGES);

  batchQueueAnimationLoading(ANIMATIONS);

  const app = mountPixiApp(element);

  setPixiApp(ReservedEntity.DEFAULT_PIXI_APP, app);

  SCENE_MANAGER.registerScene(new EditorScene(), SceneId.EDITOR_SCENE);
  SCENE_MANAGER.registerScene(new GameScene(), SceneId.GAME_SCENE);
  SCENE_MANAGER.registerScene(new GameOverScene(), SceneId.GAME_OVER_SCENE);
}

export function startApp() {
  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
  initCameraSystem();
  SCENE_MANAGER.start(SceneId.EDITOR_SCENE);
  reserveEntities();
  loadComponents();
}

export function stopApp() {
  window.onkeydown = null;
  window.onkeyup = null;
}
