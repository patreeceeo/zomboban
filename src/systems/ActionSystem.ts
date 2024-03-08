import { World } from "../EntityManager";
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

export abstract class Action<Entity, Context extends World> {
  abstract step(entity: Entity, context: Context): void;
  abstract stepBack(entity: Entity, context: Context): void;
}

/*
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */
interface BaseAction {
  readonly isFinal?: boolean;
  readonly entityId: number;
  readonly effectedArea: Rectangle;
  isComplete: boolean;
  progress(deltaTime: number, elapsedTime: number): void;
}

export interface FinalAction extends BaseAction {
  readonly isFinal: true;
}

export interface ActionOld extends BaseAction {
  undo(): void;
}

type AnyAction = ActionOld | FinalAction;

const ACTION_QUEUE: AnyAction[] = [];
const UNDO_STACK: AnyAction[][] = [];
const ACTIONS_IN_PROGRESS: Set<AnyAction> = new Set();

export function enqueueActionOld(action: AnyAction) {
  ACTION_QUEUE.push(action);
  peekUndoPoint()?.push(action!);
}

export function getActionsOld(): ReadonlyArray<AnyAction> {
  return ACTION_QUEUE;
}

export function hasQueuedActionsOld(entityId: number) {
  let result = false;
  for (const action of ACTION_QUEUE) {
    if (action.entityId === entityId) {
      result = true;
      break;
    }
  }
  return result;
}

export function getQueuedActionsOld(entityId: number): AnyAction[] {
  return ACTION_QUEUE.filter((action) => action.entityId === entityId);
}

export function removeQueuedActionsOld(entityId: number) {
  filterInPlace(ACTION_QUEUE, (action) => action.entityId !== entityId);
}

export function hasActionsInProgressOld(entityId: number) {
  let result = false;
  for (const action of ACTIONS_IN_PROGRESS) {
    if (action.entityId === entityId) {
      result = true;
      break;
    }
  }
  return result;
}

export function shiftActionOld() {
  invariant(ACTION_QUEUE.length > 0, "No actions");
  return ACTION_QUEUE.shift()!;
}

export function createUndoPointOld(): AnyAction[] {
  return [];
}

export function pushUndoPointOld(point: AnyAction[]) {
  UNDO_STACK.push(point);
}

export function hasUndoPointOld(): boolean {
  return UNDO_STACK.length > 0;
}

export function popUndoPointOld(): AnyAction[] {
  invariant(hasUndoPointOld(), "No undo points");
  return UNDO_STACK.pop()!;
}

export function peekUndoPoint(): AnyAction[] | undefined {
  return UNDO_STACK.at(-1);
}

export function applyUndoPointOld(point: AnyAction[]) {
  for (const action of point) {
    if (!action.isFinal) {
      action.undo();
    }
  }
}

export function undoAllOld() {
  while (hasUndoPointOld()) {
    applyUndoPointOld(popUndoPointOld());
  }
}

export function ActionSystemOld(deltaTime: number, elapsedTime: number) {
  while (ACTION_QUEUE.length > 0) {
    const action = shiftActionOld();
    ACTIONS_IN_PROGRESS.add(action);
  }
  for (const action of ACTIONS_IN_PROGRESS) {
    action.progress(deltaTime, elapsedTime);
    if (action.isComplete) {
      ACTIONS_IN_PROGRESS.delete(action);
      if (action.isFinal) {
        undoAllOld();
      }
    }
  }
}
