import {
  EntityName,
  addEntity,
  getNamedEntity,
  setNamedEntity,
} from "./Entity";
import { handleKeyDown, handleKeyUp } from "./Input";
import { Layer, setLayer } from "./components/Layer";
import { setLookLike } from "./components/LookLike";
import { setPixiApp } from "./components/PixiApp";
import { setPosition } from "./components/Position";
import { SPRITE_SIZE } from "./components/Sprite";
import { NAMED_ENTITY_IMAGES } from "./constants";
import { batchQueueImageLoadingAsNamedEntity } from "./functions/ImageLoading";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  removeRhythmCallback,
} from "./Rhythm";
import { EditorSystem, cleanupEditorSystem } from "./systems/EditorSystem";
import { GameSystem } from "./systems/GameSystem";
import { LoadingSystem } from "./systems/LoadingSystem";
import { RenderSystem, mountPixiApp } from "./systems/RenderSystem";
import {
  Task,
  TaskMap,
  TaskSwitcherSystem,
  getCurrentTask,
} from "./systems/TaskSwitcherSystem";

if (module.hot) {
  module.hot.accept((getParents) => {
    return getParents();
  });
}

export function startLoading(element: HTMLElement) {
  batchQueueImageLoadingAsNamedEntity(NAMED_ENTITY_IMAGES);

  const app = mountPixiApp(element);
  const defaultPixiAppId = addEntity();
  setPixiApp(defaultPixiAppId, app);
  setNamedEntity(EntityName.DEFAULT_PIXI_APP, defaultPixiAppId);

  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      const entityId = addEntity();
      setPosition(entityId, x * SPRITE_SIZE, y * SPRITE_SIZE);
      setLookLike(entityId, getNamedEntity(EntityName.FLOOR_IMAGE));
      setPixiApp(entityId, app);
      setLayer(entityId, Layer.BACKGROUND);
    }
  }
}

const RHYTHMS: Array<number> = [];

const TASK_MAP: TaskMap = {
  [Task.EDIT_GAME]: startEditor,
  [Task.PLAY_GAME]: startGame,
};
const TASK_CLEANUP_MAP: TaskMap = {
  [Task.EDIT_GAME]: () => {
    stopSystems();
    cleanupEditorSystem();
  },
  [Task.PLAY_GAME]: stopSystems,
};

export function startApp() {
  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
  TASK_MAP[getCurrentTask()]();
}

export function stopApp() {
  window.onkeydown = null;
  window.onkeyup = null;
  TASK_CLEANUP_MAP[getCurrentTask()]();
}

function startEditor() {
  RHYTHMS.push(addSteadyRhythmCallback(100, LoadingSystem));

  RHYTHMS.push(
    addFrameRhythmCallback(() => {
      EditorSystem();
      TaskSwitcherSystem(TASK_MAP, TASK_CLEANUP_MAP);
      RenderSystem();
    }),
  );
}

function startGame() {
  RHYTHMS.push(addSteadyRhythmCallback(100, LoadingSystem));

  RHYTHMS.push(
    addFrameRhythmCallback(() => {
      GameSystem();
      TaskSwitcherSystem(TASK_MAP, TASK_CLEANUP_MAP);
      RenderSystem();
    }),
  );
}

function stopSystems() {
  RHYTHMS.forEach(removeRhythmCallback);
  RHYTHMS.length = 0;
}
