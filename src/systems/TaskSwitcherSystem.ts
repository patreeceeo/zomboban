import { createInputQueue, includesKey, Key } from "../Input";

export const enum Task {
  PLAY_GAME,
  EDIT_GAME,
}

let currentTask = Task.EDIT_GAME;

export function getCurrentTask() {
  return currentTask;
}

export type TaskMap = Record<Task, () => void>;

const inputQueue = createInputQueue();

export function TaskSwitcherSystem(
  taskMap: Readonly<TaskMap>,
  cleanupMap: Readonly<TaskMap>,
) {
  const newInput = inputQueue.shift();
  if (
    newInput !== undefined &&
    newInput !== inputQueue.at(-1) &&
    includesKey(newInput, Key.Space)
  ) {
    const previousTask = currentTask;
    currentTask =
      currentTask === Task.PLAY_GAME ? Task.EDIT_GAME : Task.PLAY_GAME;
    cleanupMap[previousTask]();
    taskMap[currentTask]();
  }
  return false;
}
