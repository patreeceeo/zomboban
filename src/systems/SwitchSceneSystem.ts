import { LoopCounter } from "../Counter";
import { createInputQueue, includesKey, Key } from "../Input";
import { SCENE_LIST } from "../scenes";

const currentSceneIndex = new LoopCounter();

const inputQueue = createInputQueue();

export function SwitchSceneSystem() {
  const newInput = inputQueue.shift();
  if (
    newInput !== undefined &&
    newInput !== inputQueue.at(-1) &&
    includesKey(newInput, Key.Space)
  ) {
    currentSceneIndex.max = SCENE_LIST.length - 1;
    currentSceneIndex.next();
  }
  return SCENE_LIST[currentSceneIndex.value];
}
