import { Action, ActionType } from "../systems/ActionSystem";
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
  type = ActionType.Move;

  constructor(
    readonly entityId: number,
    readonly initialX: TilesX,
    readonly initialY: TilesY,
    readonly targetX: TilesX,
    readonly targetY: TilesY,
  ) {}

  apply() {
    // TODO animate
    const { entityId: id, targetX, targetY, initialX, initialY } = this;
    setPosition(
      id,
      convertTilesXToPixels(targetX),
      convertTilesYToPixels(targetY),
    );
    removeObjectFromTile(id, initialX, initialY);
    placeObjectInTile(id, targetX, targetY);
  }

  undo() {
    // TODO animate
    const { entityId: id, targetX, targetY, initialX, initialY } = this;
    setPosition(
      id,
      convertTilesXToPixels(initialX),
      convertTilesYToPixels(initialY),
    );
    removeObjectFromTile(id, targetX, targetY);
    placeObjectInTile(id, initialX, initialY);
  }
}
