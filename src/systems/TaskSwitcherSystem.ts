import { isKeyDown, Key } from "../Input";

export const enum Task {
  PLAY_GAME,
  EDIT_GAME,
}

let lastKeyDownTime = performance.now();

let currentTask = Task.EDIT_GAME;

export function getCurrentTask() {
  return currentTask;
}

export type TaskMap = Record<Task, () => void>;

export function TaskSwitcherSystem(
  taskMap: Readonly<TaskMap>,
  cleanupMap: Readonly<TaskMap>,
) {
  if (isKeyDown(Key.Space)) {
    const now = performance.now();
    if (now - lastKeyDownTime > 200) {
      const previousTask = currentTask;
      currentTask =
        currentTask === Task.PLAY_GAME ? Task.EDIT_GAME : Task.PLAY_GAME;
      cleanupMap[previousTask]();
      taskMap[currentTask]();
    }
    lastKeyDownTime = now;
  }
  return false;
}
