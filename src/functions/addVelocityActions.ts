import { getTileX, getTileY } from "../Tile";
import { MoveAction } from "../actions/MoveAction";
import { ActLike, isActLike } from "../components/ActLike";
import { getVelocityX } from "../components/VelocityX";
import { getVelocityY } from "../components/VelocityY";
import { addAction } from "../systems/ActionSystem";
import { isMoveBlocked } from "../systems/PhysicsSystem";
import { convertPpsToTxps, convertPpsToTyps } from "../units/convert";

export function addVelocityActions(id: number) {
  const tileX = getTileX(id);
  const tileY = getTileY(id);
  const velocityX = getVelocityX(id);
  const velocityY = getVelocityY(id);
  const txps = convertPpsToTxps(velocityX);
  const typs = convertPpsToTyps(velocityY);
  const targetX = (tileX + txps) as TilesX;
  const targetY = (tileY + typs) as TilesY;
  if (
    (velocityX !== 0 || velocityY !== 0) &&
    (!isMoveBlocked(tileX, tileY, txps, typs) || isActLike(id, ActLike.POTION))
  ) {
    addAction(new MoveAction(id, tileX, tileY, targetX, targetY));
  }
}
