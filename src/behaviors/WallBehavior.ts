import {
  Event,
  EventType,
  addEventListener,
  removeEventListener,
} from "../Event";
import { getTileX, getTileY } from "../Tile";
import { MoveAction } from "../actions/MoveAction";
import { ActLike, Behavior } from "../components/ActLike";
import { Action } from "../systems/ActionSystem";

export class WallBehavior implements Behavior {
  readonly type = ActLike.WALL;
  tileX: TilesX = 0 as TilesX;
  tileY: TilesY = 0 as TilesY;

  constructor(readonly entityId: number) {}

  initialize(): void {
    const { entityId } = this;
    this.tileX = getTileX(entityId);
    this.tileY = getTileY(entityId);
    addEventListener(EventType.TEST_ACTION, this.onTestAction);
  }

  destroy(): void {
    removeEventListener(EventType.TEST_ACTION, this.onTestAction);
  }

  toString() {
    return "WALL";
  }

  onFrame() {}

  onTestAction = (event: Event<Action>) => {
    const { tileX, tileY } = this;
    if (
      event.data instanceof MoveAction &&
      event.effectedArea.includes(tileX, tileY)
    ) {
      this.onBeforeMove(event as Event<MoveAction>);
    }
  };

  onBeforeMove(event: Event<MoveAction>) {
    const { tileX: wallX, tileY: wallY } = this;
    const { targetX, targetY } = event.data;

    if (targetX === wallX && targetY === wallY) {
      event.isCancelled = true;
    }
  }
}
