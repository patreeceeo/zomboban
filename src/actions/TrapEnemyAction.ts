import {
  EntityFrameOperation,
  setEntityFrameOperation,
} from "../components/EntityFrameOperation";
import { Rectangle } from "../Rectangle";
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
    setEntityFrameOperation(this.entityId, EntityFrameOperation.REMOVE);
    this.isComplete = true;
  }

  undo(): void {
    setEntityFrameOperation(this.entityId, EntityFrameOperation.RESTORE);
    this.isComplete = false;
  }
}