import { LoopCounter } from "../Counter";
import { createInputQueue, includesKey } from "../Input";
import { KEY_MAPS } from "../constants";
import { SCENE_MANAGER, SceneId } from "../scenes";

const SCENE_LIST = [SceneId.EDITOR, SceneId.GAME];
const currentSceneIndex = new LoopCounter(SCENE_LIST.length - 1);

const inputQueue = createInputQueue();

export function GlobalHotkeySystem() {
  const newInput = inputQueue.shift();
  if (newInput !== undefined) {
    if (
      newInput !== inputQueue.at(-1) &&
      includesKey(newInput, KEY_MAPS.TOGGLE_EDITOR)
    ) {
      currentSceneIndex.next();
      SCENE_MANAGER.start(SCENE_LIST[currentSceneIndex.value]);
    } else if (includesKey(newInput, KEY_MAPS.SHOW_MENU)) {
      SCENE_MANAGER.start(SceneId.MENU);
    }
  }
}
