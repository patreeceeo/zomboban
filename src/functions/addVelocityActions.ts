import { getTileX, getTileY } from "../Tile";
import { MoveAction } from "../actions/MoveAction";
import { getVelocityX } from "../components/VelocityX";
import { getVelocityY } from "../components/VelocityY";
import { addAction } from "../systems/ActionSystem";
import { convertPpsToTxps, convertPpsToTyps } from "../units/convert";

export function addVelocityActions(id: number) {
  const tileX = getTileX(id);
  const tileY = getTileY(id);
  const velocityX = getVelocityX(id);
  const velocityY = getVelocityY(id);
  const targetX = (tileX + convertPpsToTxps(velocityX)) as TilesX;
  const targetY = (tileY + convertPpsToTyps(velocityY)) as TilesY;
  if (velocityX !== 0 || velocityY !== 0) {
    addAction(new MoveAction(id, tileX, tileY, targetX, targetY));
  }
}
