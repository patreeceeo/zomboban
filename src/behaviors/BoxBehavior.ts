import { PlayerBehavior } from ".";
import { humanizeEntity } from "../Debug";
import {
  Event,
  EventType,
  addEventListener,
  removeEventListener,
} from "../Event";
import { getTileX, getTileY } from "../Tile";
import { MoveAction } from "../actions/MoveAction";
import { TrapEnemyAction } from "../actions/TrapEnemyAction";
import {
  ActLike,
  Behavior,
  getActLike,
  isActLike,
} from "../components/ActLike";
import { showCoincidingTileMessage } from "../functions/Overlay";
import { tryAction } from "../functions/tryAction";
import {
  Action,
  enqueueAction,
  getQueuedActions,
  hasQueuedActions,
  removeQueuedActions,
} from "../systems/ActionSystem";

export class BoxBehavior implements Behavior {
  readonly type = ActLike.BOX;
  velocityX: Txps = 0 as Txps;
  velocityY: Typs = 0 as Typs;
  constructor(readonly entityId: number) {}

  start(): void {
    addEventListener(EventType.TEST_ACTION, this.onTestAction);
    addEventListener(EventType.COMPLETE_ACTION, this.onCompleteAction);
  }

  stop(): void {
    removeEventListener(EventType.TEST_ACTION, this.onTestAction);
    removeEventListener(EventType.COMPLETE_ACTION, this.onCompleteAction);
  }

  toString() {
    return "BOX";
  }

  onFrame() {}

  onTestAction = (event: Event<Action>) => {
    const { entityId } = this;
    const { data: action, effectedArea } = event;
    const x = getTileX(entityId);
    const y = getTileY(entityId);
    if (
      action instanceof MoveAction &&
      action.entityId !== entityId &&
      effectedArea.includes(x, y)
    ) {
      this.onTestMove(event as Event<MoveAction>);
    }
  };

  onCompleteAction = (event: Event<Action>) => {
    const { entityId } = this;
    const { data: action } = event;
    if (
      action instanceof MoveAction &&
      action.entityId !== entityId &&
      action.effectedArea.includes(getTileX(entityId), getTileY(entityId))
    ) {
      this.onCompleteMove(event.data.entityId);
    }
  };

  async onTestMove(event: Event<MoveAction>) {
    const { entityId } = this;
    const x = getTileX(entityId);
    const y = getTileY(entityId);

    if (!isActLike(event.data.entityId, ActLike.PUSHER)) {
      console.log(
        `${humanizeEntity(entityId)} cancelling action from ${humanizeEntity(
          event.data.entityId,
        )} because it's not a pusher`,
      );
      event.isCancelled = true;
    } else {
      const dx = getMoveEventVelocityX(event);
      const dy = getMoveEventVelocityY(event);

      if (hasQueuedActions(entityId)) {
        // we're already being pushed by something else
        // get the queued action
        const action = getQueuedActions(entityId)[0] as MoveAction;

        // remove the action from the queue because we're going to change it
        // and it might not be successful anymore
        // TODO Violating the rules of actions. Find another way to do this.
        removeQueuedActions(entityId);

        // combine the velocities
        action.targetX = (action.targetX + dx) as TilesX;
        action.targetY = (action.targetY + dy) as TilesY;
        if (action.targetX !== x || action.targetY !== y) {
          const success = tryAction(action, false);

          if (!success) {
            // try without the most recent addition
            action.targetX = (action.targetX - dx) as TilesX;
            action.targetY = (action.targetY - dy) as TilesY;

            const success = tryAction(action, false);

            if (!success) {
              // try with only the most recent addition
              action.targetX = dx as TilesX;
              action.targetY = dy as TilesY;
              const success = tryAction(action, false);

              if (!success) {
                event.isCancelled = true;
                `${humanizeEntity(
                  entityId,
                )} cancelling action from ${humanizeEntity(
                  event.data.entityId,
                )} because no combination of the velocities worked`;
              }
            }
          }
        } else {
          `${humanizeEntity(entityId)} cancelling action from ${humanizeEntity(
            event.data.entityId,
          )} because sum of velocities is 0`;
          event.isCancelled = true;
        }
      } else {
        const action = new MoveAction(
          entityId,
          x,
          y,
          (x + dx) as TilesX,
          (y + dy) as TilesY,
        );

        const success = tryAction(action, false);

        if (!success) {
          event.isCancelled = true;
          `${humanizeEntity(entityId)} cancelling action from ${humanizeEntity(
            event.data.entityId,
          )} because its own action failed`;
        }
      }
    }
  }

  onCompleteMove(otherEntityId: number) {
    const { entityId } = this;
    const x = getTileX(entityId);
    const y = getTileY(entityId);

    const otherX = getTileX(otherEntityId);
    const otherY = getTileY(otherEntityId);

    if (otherX === x && otherY === y) {
      // trapped in box
      if (isActLike(otherEntityId, ActLike.PLAYER)) {
        const playerBehavior = getActLike(otherEntityId);
        showCoincidingTileMessage([entityId]);
        (playerBehavior as PlayerBehavior).die();
      }
      if (isActLike(otherEntityId, ActLike.ENEMY)) {
        enqueueAction(new TrapEnemyAction(otherEntityId));
      }
    }
  }
}

function getMoveEventVelocityX(event: Event<MoveAction>) {
  const { targetX, initialX } = event.data;
  return targetX - initialX;
}
function getMoveEventVelocityY(event: Event<MoveAction>) {
  const { targetY, initialY } = event.data;
  return targetY - initialY;
}
