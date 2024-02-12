import { Rectangle } from "../Rectangle";
import { state } from "../state";
import { Action } from "../systems/ActionSystem";
import { getTileX, getTileY } from "../Tile";

export class TrapEnemyAction implements Action {
  isComplete = false;
  readonly effectedArea: Rectangle;

  constructor(readonly entityId: number) {
    const x = getTileX(entityId);
    const y = getTileY(entityId);
    this.effectedArea = new Rectangle(x, y, x, y);
  }

  progress(): void {
    state.setToBeRemovedThisFrame(this.entityId);
    this.isComplete = true;
  }

  undo(): void {
    state.setToBeRestoredThisFrame(this.entityId);
    this.isComplete = false;
  }
}
