import { invariant } from "../Error";
import { Rectangle } from "../Rectangle";
import { filterInPlace } from "../functions/Array";

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
  readonly entityId: number;
  readonly effectedArea: Rectangle;
  isComplete: boolean;
  progress(deltaTime: number, elapsedTime: number): void;
  undo(): void;
}

const ACTION_QUEUE: Action[] = [];
const UNDO_STACK: Action[][] = [];
const ACTIONS_IN_PROGRESS: Set<Action> = new Set();

export function enqueueAction(action: Action) {
  ACTION_QUEUE.push(action);
  peekUndoPoint()?.push(action!);
}

export function getActions(): ReadonlyArray<Action> {
  return ACTION_QUEUE;
}

export function hasQueuedActions(entityId: number) {
  let result = false;
  for (const action of ACTION_QUEUE) {
    if (action.entityId === entityId) {
      result = true;
      break;
    }
  }
  return result;
}

export function getQueuedActions(entityId: number): Action[] {
  return ACTION_QUEUE.filter((action) => action.entityId === entityId);
}

export function removeQueuedActions(entityId: number) {
  filterInPlace(ACTION_QUEUE, (action) => action.entityId !== entityId);
}

export function hasActionsInProgress(entityId: number) {
  let result = false;
  for (const action of ACTIONS_IN_PROGRESS) {
    if (action.entityId === entityId) {
      result = true;
      break;
    }
  }
  return result;
}

export function shiftAction() {
  invariant(ACTION_QUEUE.length > 0, "No actions");
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

export function undoAll() {
  while (hasUndoPoint()) {
    applyUndoPoint(popUndoPoint());
  }
}

export function ActionSystem(deltaTime: number, elapsedTime: number) {
  while (ACTION_QUEUE.length > 0) {
    const action = shiftAction();
    ACTIONS_IN_PROGRESS.add(action);
  }
  for (const action of ACTIONS_IN_PROGRESS) {
    action.progress(deltaTime, elapsedTime);
    if (action.isComplete) {
      ACTIONS_IN_PROGRESS.delete(action);
    }
  }
}
