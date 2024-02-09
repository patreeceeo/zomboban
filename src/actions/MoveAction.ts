import { Action } from "../systems/ActionSystem";
import { convertTilesXToPixels, convertTilesYToPixels } from "../units/convert";
import { placeObjectInTile, removeObjectFromTile } from "../Tile";
import { Event, EventType, dispatchEvent } from "../Event";
import { getCameraViewRectangle } from "../functions/Camera";
import { Rectangle } from "../Rectangle";
import { ReservedEntity } from "../entities";
import { mutState } from "../state";

/**
 * Move an entity from one position to another.
 * Used for:
 *  - moving the player
 *  - moving zombies
 *  - pushing crates
 *  - moving potions once they've been thrown.
 */
export class MoveAction implements Action {
  static readonly requiredTime: number = 350;
  #effectedArea = new Rectangle(0, 0, 0, 0);
  isComplete = false;
  elapsedTime = 0;

  constructor(
    readonly entityId: number,
    readonly initialX: TilesX,
    readonly initialY: TilesY,
    public targetX: TilesX,
    public targetY: TilesY,
  ) {}

  get effectedArea() {
    const { targetX, targetY } = this;
    const effectedArea = this.#effectedArea;
    effectedArea.x1 = effectedArea.x2 = targetX;
    effectedArea.y1 = effectedArea.y2 = targetY;
    return effectedArea;
  }

  get deltaX(): TilesX {
    return (this.targetX - this.initialX) as TilesX;
  }

  get deltaY(): TilesY {
    return (this.targetY - this.initialY) as TilesY;
  }

  progress(deltaTime: number) {
    const { entityId: id, initialX, initialY, deltaX, deltaY } = this;
    const requiredTime = MoveAction.requiredTime;
    const elapsedTime = (this.elapsedTime += deltaTime);
    if (elapsedTime >= requiredTime) {
      this.complete();
    } else {
      const x = convertTilesXToPixels(
        ((elapsedTime / requiredTime) * deltaX + initialX) as TilesX,
      );
      const y = convertTilesYToPixels(
        ((elapsedTime / requiredTime) * deltaY + initialY) as TilesY,
      );
      mutState.setPosition(id, x, y);
    }
  }

  complete(): void {
    const { entityId, targetX, targetY, initialX, initialY } = this;
    mutState.setPosition(
      entityId,
      convertTilesXToPixels(targetX),
      convertTilesYToPixels(targetY),
    );
    removeObjectFromTile(entityId, initialX, initialY);
    placeObjectInTile(entityId, targetX, targetY);
    this.isComplete = true;
    dispatchEvent(
      new Event(
        EventType.COMPLETE_ACTION,
        this,
        getCameraViewRectangle(ReservedEntity.CAMERA),
      ),
    );
  }

  undo() {
    const { entityId, targetX, targetY, initialX, initialY } = this;
    mutState.setPosition(
      entityId,
      convertTilesXToPixels(initialX),
      convertTilesYToPixels(initialY),
    );
    removeObjectFromTile(entityId, targetX, targetY);
    placeObjectInTile(entityId, initialX, initialY);
  }
}
