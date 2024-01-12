import { EntityName, addNamedEntities, getNamedEntity } from "./Entity";
import { handleKeyDown, handleKeyUp } from "./Input";
import { setPixiApp } from "./components/PixiApp";
import { NAMED_ENTITY_ANIMATIONS, NAMED_ENTITY_IMAGES } from "./constants";
import { batchQueueImageLoadingAsNamedEntity } from "./functions/ImageLoading";
import { mountPixiApp } from "./systems/RenderSystem";
import { initCameraSystem } from "./systems/CameraSystem";
import { batchQueueAnimationLoadingAsNamedEntity } from "./functions/AnimationLoading";
import { EDITOR_SCENE, SCENE_MANAGER } from "./scenes";
import { loadComponents } from "./ComponentData";

addNamedEntities();

export function startLoading(element: HTMLElement) {
  batchQueueImageLoadingAsNamedEntity(NAMED_ENTITY_IMAGES);

  batchQueueAnimationLoadingAsNamedEntity(NAMED_ENTITY_ANIMATIONS);

  const app = mountPixiApp(element);
  setPixiApp(getNamedEntity(EntityName.DEFAULT_PIXI_APP), app);
}

export function startApp() {
  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
  initCameraSystem();
  SCENE_MANAGER.start(EDITOR_SCENE);
  loadComponents();
}

export function stopApp() {
  window.onkeydown = null;
  window.onkeyup = null;
}
