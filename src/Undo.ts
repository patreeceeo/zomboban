import { invariant } from "./Error.js";
import { hasPosition } from "./components/Position.js";
import { getPositionX } from "./components/PositionX.js";
import { getPositionY } from "./components/PositionY.js";
import { setVelocity } from "./components/Velocity.js";

const UNDO_POSITION_X_STACK: Px[][] = [];
const UNDO_POSITION_Y_STACK: Px[][] = [];

export function pushEmptyUndo() {
  UNDO_POSITION_X_STACK.push([]);
  UNDO_POSITION_Y_STACK.push([]);
}

export function pushUndo(entityIds: ReadonlyArray<number>) {
  const undoItemPositionX = [];
  const undoItemPositionY = [];
  for (const entityId of entityIds) {
    if (!hasPosition(entityId)) {
      continue;
    }
    const positionX = getPositionX(entityId);
    const positionY = getPositionY(entityId);
    undoItemPositionX[entityId] = positionX;
    undoItemPositionY[entityId] = positionY;
  }
  UNDO_POSITION_X_STACK.push(undoItemPositionX);
  UNDO_POSITION_Y_STACK.push(undoItemPositionY);
}

export function amendUndo(entityIds: ReadonlyArray<number>) {
  invariant(hasUndo(), "No undo item found");
  const undoItemPositionX = UNDO_POSITION_X_STACK.at(-1)!;
  const undoItemPositionY = UNDO_POSITION_Y_STACK.at(-1)!;
  for (const entityId of entityIds) {
    undoItemPositionX[entityId] = getPositionX(entityId);
    undoItemPositionY[entityId] = getPositionY(entityId);
  }
}

export function hasUndo() {
  return UNDO_POSITION_X_STACK.length > 0;
}

export function popUndo(entityIds: ReadonlyArray<number>) {
  invariant(hasUndo(), "No undo item found");
  const undoItemPositionX = UNDO_POSITION_X_STACK.pop();
  const undoItemPositionY = UNDO_POSITION_Y_STACK.pop();

  for (const entityId of entityIds) {
    if (entityId in undoItemPositionX!) {
      const x = getPositionX(entityId);
      const y = getPositionY(entityId);
      const newX = undoItemPositionX![entityId];
      const newY = undoItemPositionY![entityId];
      setVelocity(entityId, (newX - x) as Pps, (newY - y) as Pps);
    }
  }
}

export function clearUndo() {
  UNDO_POSITION_X_STACK.length = 0;
  UNDO_POSITION_Y_STACK.length = 0;
}
