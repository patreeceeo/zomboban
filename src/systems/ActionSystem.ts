import { invariant } from "../Error";

/**
 * @fileoverview an application of the command pattern. I just like the word "action" better.
 * Every change to world state can be represented by an Action object, which is added to a queue to be applied.
 * Rules of Actions:
 *  - No other system should be able to mutate the game state (entity components) directly.
 *  - Once an action is added to the queue, it will be applied at the end of the frame.
 *  - Actions are immutable.
 *  - The action does what it says. Keep it simple.
 *  - Avoid control flow statements (if, switch, for, while...) in actions.
 *     - Instead, make sure that only the appropriate actions are added to the queue.
 *
 * The motivation for this is to support undo/redo.
 *
 */

export interface Action {
  isComplete: boolean;
  progress(deltaTime: number): void;
  undo(): void;
}

const ACTION_QUEUE: Action[] = [];
const UNDO_STACK: Action[][] = [];
const ACTIONS_IN_PROGRESS: Set<Action> = new Set();

export function addAction(action: Action) {
  ACTION_QUEUE.push(action);
  peekUndoPoint()?.push(action!);
}

export function getActions(): ReadonlyArray<Action> {
  return ACTION_QUEUE;
}

export function hasQueuedActions() {
  return ACTION_QUEUE.length > 0;
}

export function hasActionsInProgress() {
  return ACTIONS_IN_PROGRESS.size > 0;
}

export function shiftAction() {
  invariant(hasQueuedActions(), "No actions");
  return ACTION_QUEUE.shift()!;
}

export function createUndoPoint(): Action[] {
  return [];
}

export function pushUndoPoint(point: Action[]) {
  UNDO_STACK.push(point);
}

export function hasUndoPoint(): boolean {
  return UNDO_STACK.length > 0;
}

export function popUndoPoint(): Action[] {
  invariant(hasUndoPoint(), "No undo points");
  return UNDO_STACK.pop()!;
}

export function peekUndoPoint(): Action[] | undefined {
  return UNDO_STACK.at(-1);
}

export function applyUndoPoint(point: Action[]) {
  for (const action of point) {
    action.undo();
  }
}

export function ActionSystem(deltaTime: number) {
  while (hasQueuedActions()) {
    const action = shiftAction();
    ACTIONS_IN_PROGRESS.add(action);
  }
  for (const action of ACTIONS_IN_PROGRESS) {
    action.progress(deltaTime);
    if (action.isComplete) {
      ACTIONS_IN_PROGRESS.delete(action);
    }
  }
}
