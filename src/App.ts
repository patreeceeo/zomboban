import { EntityName, addNamedEntities, getNamedEntity } from "./Entity";
import { drainInputQueues, handleKeyDown, handleKeyUp } from "./Input";
import { setPixiApp } from "./components/PixiApp";
import { NAMED_ENTITY_ANIMATIONS, NAMED_ENTITY_IMAGES } from "./constants";
import { batchQueueImageLoadingAsNamedEntity } from "./functions/ImageLoading";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  removeRhythmCallback,
} from "./Rhythm";
import { EditorSystem, stopEditorSystem } from "./systems/EditorSystem";
import { GameSystem, stopGameSystem } from "./systems/GameSystem";
import { LoadingSystem } from "./systems/LoadingSystem";
import { RenderSystem, mountPixiApp } from "./systems/RenderSystem";
import {
  Task,
  TaskMap,
  TaskSwitcherSystem,
  getCurrentTask,
} from "./systems/TaskSwitcherSystem";
import {
  PhysicsSystem,
  initializePhysicsSystem,
} from "./systems/PhysicsSystem";
import { loadComponents } from "./functions/loadComponents";
import { RemoveEntitySystem } from "./systems/RemoveEntitySystem";
import { CameraSystem, initCameraSystem } from "./systems/CameraSystem";
import { batchQueueAnimationLoadingAsNamedEntity } from "./functions/AnimationLoading";
import { ActionSystem } from "./systems/ActionSystem";

addNamedEntities();

export function startLoading(element: HTMLElement) {
  batchQueueImageLoadingAsNamedEntity(NAMED_ENTITY_IMAGES);

  batchQueueAnimationLoadingAsNamedEntity(NAMED_ENTITY_ANIMATIONS);

  const app = mountPixiApp(element);
  setPixiApp(getNamedEntity(EntityName.DEFAULT_PIXI_APP), app);
}

const TASK_RHYTHMS: Array<number> = [];

const TASK_MAP: TaskMap = {
  [Task.EDIT_GAME]: startEditor,
  [Task.PLAY_GAME]: startGame,
};
const TASK_CLEANUP_MAP: TaskMap = {
  [Task.EDIT_GAME]: () => {
    stopCurrentTask();
    stopEditorSystem();
  },
  [Task.PLAY_GAME]: () => {
    stopCurrentTask();
    stopGameSystem();
  },
};

export function startApp() {
  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
  initCameraSystem();
  TASK_MAP[getCurrentTask()]();
  addFrameRhythmCallback(() => {
    TaskSwitcherSystem(TASK_MAP, TASK_CLEANUP_MAP);
  });
  loadComponents();
}

export function stopApp() {
  window.onkeydown = null;
  window.onkeyup = null;
  TASK_CLEANUP_MAP[getCurrentTask()]();
}

function startEditor() {
  TASK_RHYTHMS.push(addSteadyRhythmCallback(100, LoadingSystem));

  TASK_RHYTHMS.push(
    addFrameRhythmCallback(() => {
      EditorSystem();
      CameraSystem();
      RenderSystem();
      RemoveEntitySystem();
    }),
  );
}

function startGame() {
  TASK_RHYTHMS.push(addSteadyRhythmCallback(100, LoadingSystem));

  initializePhysicsSystem();
  TASK_RHYTHMS.push(
    addFrameRhythmCallback((deltaTime) => {
      GameSystem();
      PhysicsSystem();
      ActionSystem(deltaTime);
      CameraSystem();
      RenderSystem();
      RemoveEntitySystem();
    }),
  );
}

function stopCurrentTask() {
  TASK_RHYTHMS.forEach(removeRhythmCallback);
  TASK_RHYTHMS.length = 0;
  drainInputQueues();
}
