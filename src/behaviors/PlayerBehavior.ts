import { throttle } from "../util";
import {
  Key,
  KeyCombo,
  createInputQueue,
  includesKey,
  removeKey
} from "../Input";
import { getTileX, getTileY } from "../Tile";
import {
  ActionOld,
  applyUndoPointOld,
  hasActionsInProgressOld,
  hasUndoPointOld,
  popUndoPointOld
} from "../systems/ActionSystem";
// import { followEntityWithCamera } from "../systems/CameraSystem";
import { MoveAction } from "../actions/MoveAction";
import { ThrowPotionAction } from "../actions/ThrowPotion";
import { tryAction } from "../functions/tryAction";
import { INITIAL_INPUT_THROTTLE, KEY_MAPS } from "../constants";
import {
  Event,
  EventType,
  addEventListener,
  removeEventListener
} from "../Event";
import { ActLike } from "../components/ActLike";
import { stateOld } from "../state";
import { BoxBehavior } from ".";
import { Behavior, BehaviorComponent } from "../components/Behavior";
import { PositionComponent } from "../components";

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

  serialize() {
    return this.constructor.name;
  }

  onTestAction = (event: Event<ActionOld>) => {
    const { entityId } = this;
    const { data: action, effectedArea } = event;
    const x = getTileX(entityId);
    const y = getTileY(entityId);
    if (
      action instanceof MoveAction &&
      effectedArea.includes(x, y) &&
      stateOld.get(BehaviorComponent, action.entityId)! instanceof BoxBehavior
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
    // followEntityWithCamera(playerId);
    if (!hasActionsInProgressOld(playerId)) {
      if (input === undefined) {
        this.handleInput.cancel();
      } else {
        this.handleInput(input);
      }
    }
  }

  handleInput = throttle((input: KeyCombo) => {
    const playerId = this.entityId;
    if (includesKey(input, Key.z) && hasUndoPointOld()) {
      applyUndoPointOld(popUndoPointOld());
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
    const { x, y } = stateOld.get(PositionComponent, playerId);

    const action = isThrowing
      ? // TODO make units consistent
        new ThrowPotionAction(stateOld.addEntity(), x, y, txps, typs)
      : new MoveAction(playerId, tileX, tileY, nextTileX, nextTileY);

    tryAction(action, true);
  }, INITIAL_INPUT_THROTTLE);
}
