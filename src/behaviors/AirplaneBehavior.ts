import { getTileX, getTileY } from "../Tile";
import { MoveAction } from "../actions/MoveAction";
import { ActLike, Behavior } from "../components/ActLike";
import { tryAction } from "../functions/tryAction";

export class AirplaneBehavior implements Behavior {
  readonly type = ActLike.AIRPLANE;
  isStarted = false;
  constructor(
    readonly entityId: number,
    readonly velocityX: Txps,
    readonly velocityY: Typs,
  ) {}

  start(): void {
    this.isStarted = true;
  }

  stop(): void {
    this.isStarted = false;
  }

  toString() {
    return "AIRPLANE";
  }

  onFrame() {
    const airplaneId = this.entityId;
    const { velocityX, velocityY } = this;
    const airplaneX = getTileX(airplaneId);
    const airplaneY = getTileY(airplaneId);
    const action = new MoveAction(
      airplaneId,
      airplaneX,
      airplaneY,
      (airplaneX + velocityX) as TilesX,
      (airplaneY + velocityY) as TilesY,
    );
    tryAction(action, false);
  }
}
