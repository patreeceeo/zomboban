import { throttle } from "../util";
import {
  Key,
  KeyCombo,
  createInputQueue,
  includesKey,
  removeKey,
} from "../Input";
import { getTileX, getTileY } from "../Tile";
import { ActLike, Behavior, isActLike } from "../components/ActLike";
import {
  Action,
  applyUndoPoint,
  hasActionsInProgress,
  hasUndoPoint,
  popUndoPoint,
} from "../systems/ActionSystem";
import { followEntityWithCamera } from "../systems/CameraSystem";
import { MoveAction } from "../actions/MoveAction";
import { ThrowPotionAction } from "../actions/ThrowPotion";
import { tryAction } from "../functions/tryAction";
import { addEntity } from "../Entity";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { INITIAL_INPUT_THROTTLE, KEY_MAPS } from "../constants";
import {
  Event,
  EventType,
  addEventListener,
  removeEventListener,
} from "../Event";

export class PlayerBehavior implements Behavior {
  readonly type = ActLike.PLAYER;
  readonly inputQueue = createInputQueue();
  isStarted = false;
  constructor(readonly entityId: number) {}

  start(): void {
    this.isStarted = true;
    addEventListener(EventType.TEST_ACTION, this.onTestAction);
  }

  stop(): void {
    this.isStarted = false;
    removeEventListener(EventType.TEST_ACTION, this.onTestAction);
  }

  toString() {
    return "PLAYER";
  }

  onTestAction = (event: Event<Action>) => {
    const { entityId } = this;
    const { data: action, effectedArea } = event;
    const x = getTileX(entityId);
    const y = getTileY(entityId);
    if (
      action instanceof MoveAction &&
      effectedArea.includes(x, y) &&
      isActLike(action.entityId, ActLike.BOX)
    ) {
      this.onBeforeMove(event as Event<MoveAction>);
    }
  };

  onBeforeMove(event: Event<MoveAction>) {
    const { entityId } = this;
    const tileX = getTileX(entityId);
    const tileY = getTileY(entityId);
    const { targetX, targetY } = event.data;

    if (targetX === tileX && targetY === tileY) {
      event.isCancelled = true;
    }
  }

  onFrame() {
    const playerId = this.entityId;
    const input = this.inputQueue.shift();
    followEntityWithCamera(playerId);
    if (!hasActionsInProgress(playerId)) {
      if (input === undefined) {
        this.handleInput.cancel();
      } else {
        this.handleInput(input);
      }
    }
  }

  handleInput = throttle((input: KeyCombo) => {
    const playerId = this.entityId;
    if (includesKey(input, Key.z) && hasUndoPoint()) {
      applyUndoPoint(popUndoPoint());
      return;
    }

    const inputWithoutShift = removeKey(input, Key.Shift);

    if (!(inputWithoutShift in KEY_MAPS.MOVE)) {
      return;
    }

    const [txps, typs] = KEY_MAPS.MOVE[inputWithoutShift as Key]!;
    const tileX = getTileX(playerId);
    const tileY = getTileY(playerId);
    const nextTileX = (tileX + txps) as TilesX;
    const nextTileY = (tileY + typs) as TilesY;
    const isThrowing = includesKey(input, Key.Shift);

    const action = isThrowing
      ? // TODO make units consistent
        new ThrowPotionAction(
          addEntity(),
          getPositionX(playerId),
          getPositionY(playerId),
          txps,
          typs,
        )
      : new MoveAction(playerId, tileX, tileY, nextTileX, nextTileY);

    tryAction(action, true);
  }, INITIAL_INPUT_THROTTLE);
}
