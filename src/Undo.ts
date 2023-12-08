import { invariant } from "./Error.js";
import { hasPosition } from "./components/Position.js";
import { getPositionX } from "./components/PositionX.js";
import { getPositionY } from "./components/PositionY.js";
import { setVelocity } from "./components/Velocity.js";

const UNDO_POSITION_X_STACK: Px[][] = [];
const UNDO_POSITION_Y_STACK: Px[][] = [];

export function pushUndo(entityIds: ReadonlyArray<number>) {
  const undoItemPositionX = [];
  const undoItemPositionY = [];
  for (const entityId of entityIds) {
    if (!hasPosition(entityId)) {
      continue;
    }
    const positionX = getPositionX(entityId);
    const PositionY = getPositionY(entityId);
    undoItemPositionX[entityId] = positionX;
    undoItemPositionY[entityId] = PositionY;
  }
  // TODO don't push if no changes
  UNDO_POSITION_X_STACK.push(undoItemPositionX);
  UNDO_POSITION_Y_STACK.push(undoItemPositionY);
}

export function hasUndo() {
  return UNDO_POSITION_X_STACK.length > 0;
}

export function popUndo(entityIds: ReadonlyArray<number>) {
  const undoItemVelocityX = UNDO_POSITION_X_STACK.pop();
  const undoItemVelocityY = UNDO_POSITION_Y_STACK.pop();
  invariant(
    undoItemVelocityX !== undefined && undoItemVelocityY !== undefined,
    "No undo item found",
  );

  for (const entityId of entityIds) {
    if (entityId in undoItemVelocityX!) {
      const x = getPositionX(entityId);
      const y = getPositionY(entityId);
      const newX = undoItemVelocityX![entityId];
      const newY = undoItemVelocityY![entityId];
      setVelocity(entityId, (newX - x) as Pps, (newY - y) as Pps);
    }
  }
}

export function clearUndo() {
  UNDO_POSITION_X_STACK.length = 0;
  UNDO_POSITION_Y_STACK.length = 0;
}
