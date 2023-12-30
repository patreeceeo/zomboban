import { Action } from "../systems/ActionSystem";
import { setPosition } from "../components/Position";
import { convertTilesXToPixels, convertTilesYToPixels } from "../units/convert";
import { placeObjectInTile, removeObjectFromTile } from "../Tile";

/**
 * Move an entity from one position to another.
 * Used for:
 *  - moving the player
 *  - moving zombies
 *  - pushing crates
 *  - moving potions once they've been thrown.
 */
export class MoveAction implements Action {
  deltaX: number = 0;
  deltaY: number = 0;
  elapsedTime: number = 0;
  requiredTime: number = 700;

  constructor(
    readonly entityId: number,
    readonly initialX: TilesX,
    readonly initialY: TilesY,
    readonly targetX: TilesX,
    readonly targetY: TilesY,
  ) {
    const dx = targetX - initialX;
    const dy = targetY - initialY;
    this.deltaX = dx;
    this.deltaY = dy;
  }

  get isComplete() {
    return this.elapsedTime >= this.requiredTime;
  }

  progress(deltaTime: number) {
    const {
      entityId: id,
      targetX,
      targetY,
      initialX,
      initialY,
      deltaX,
      deltaY,
    } = this;
    const time = (this.elapsedTime += deltaTime);
    const requiredTime = this.requiredTime;
    if (this.isComplete) {
      setPosition(
        id,
        convertTilesXToPixels(targetX),
        convertTilesYToPixels(targetY),
      );
      removeObjectFromTile(id, initialX, initialY);
      placeObjectInTile(id, targetX, targetY);
    } else {
      const x = ((time / requiredTime) * deltaX + initialX) as TilesX;
      const y = ((time / requiredTime) * deltaY + initialY) as TilesY;
      setPosition(id, convertTilesXToPixels(x), convertTilesYToPixels(y));
    }
  }

  undo() {
    setPosition(
      this.entityId,
      convertTilesXToPixels(this.initialX),
      convertTilesYToPixels(this.initialY),
    );
    removeObjectFromTile(this.entityId, this.targetX, this.targetY);
    placeObjectInTile(this.entityId, this.initialX, this.initialY);
  }
}
