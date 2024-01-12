import { LoopCounter } from "../Counter";
import { createInputQueue, includesKey, Key } from "../Input";
import { SCENE_MANAGER, SceneId } from "../scenes";

const SCENE_LIST = [SceneId.EDITOR_SCENE, SceneId.GAME_SCENE];
const currentSceneIndex = new LoopCounter(SCENE_LIST.length);

const inputQueue = createInputQueue();

export function SwitchSceneSystem() {
  const newInput = inputQueue.shift();
  if (
    newInput !== undefined &&
    newInput !== inputQueue.at(-1) &&
    includesKey(newInput, Key.Space)
  ) {
    currentSceneIndex.next();
    SCENE_MANAGER.start(SCENE_LIST[currentSceneIndex.value]);
  }
}
