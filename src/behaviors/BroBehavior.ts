import { AirplaneBehavior, BoxBehavior, PlayerBehavior, WallBehavior } from ".";
import {
  Event,
  EventType,
  addEventListener,
  removeEventListener
} from "../Event";
import { getTileX, getTileY, queryTile } from "../Tile";
import { KillPlayerAction } from "../actions/KillPlayerAction";
import { MoveAction } from "../actions/MoveAction";
import { ActLike } from "../components/ActLike";
import { Behavior } from "../components/Behavior";
import { listPointsInOrthogonalRay } from "../functions/OrthogonalRay";
import { tryAction } from "../functions/tryAction";
import { stateOld } from "../state";
import {
  Action,
  enqueueAction,
  hasActionsInProgress
} from "../systems/ActionSystem";

function isTileActLike(
  tileX: number,
  tileY: number,
  ...behaviors: (new (...args: any[]) => Behavior)[]
): boolean {
  const objectIds = queryTile(tileX as TilesX, tileY as TilesY);
  const result = objectIds.some((id) =>
    behaviors.some((b) => stateOld.isBehavior(id, b))
  );
  return result;
}

const GAME_OVER_TEXT = "“Resistance is futile”, bro!";

if (import.meta.hot) {
  import.meta.hot.accept((module) => {
    if (!module) {
      import.meta.hot!.invalidate();
      return;
    }
  });
}

function isPlayerMoveAction(action: Action): action is MoveAction {
  return (
    action instanceof MoveAction &&
    stateOld.isBehavior(action.entityId, PlayerBehavior)
  );
}

// TODO its velocity isn't restored after undo
export class BroBehavior implements Behavior {
  readonly type = ActLike.BRO;
  isStarted = false;
  velocityX: Txps = 0 as Txps;
  velocityY: Typs = 0 as Typs;

  constructor(readonly entityId: number) {}

  start(): void {
    this.isStarted = true;
    addEventListener(EventType.TEST_ACTION, this.onTestAction);
    addEventListener(EventType.START_ACTION, this.onStartAction);
    addEventListener(EventType.COMPLETE_ACTION, this.onCompleteAction);
  }

  stop(): void {
    this.isStarted = false;
    removeEventListener(EventType.TEST_ACTION, this.onTestAction);
    removeEventListener(EventType.START_ACTION, this.onStartAction);
    removeEventListener(EventType.COMPLETE_ACTION, this.onCompleteAction);
  }

  serialize() {
    return this.constructor.name;
  }

  onFrame() {}

  onTestAction = (event: Event<Action>) => {
    const { entityId } = this;
    const { data: action, effectedArea } = event;
    const x = getTileX(entityId);
    const y = getTileY(entityId);
    if (
      action instanceof MoveAction &&
      effectedArea.includes(x, y) &&
      // isActLike(action.entityId, ActLike.BOX)
      stateOld.isBehavior(action.entityId, BoxBehavior)
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

  onStartAction = (event: Event<Action>) => {
    if (isPlayerMoveAction(event.data)) {
      this.onPlayerStartMove(event as Event<MoveAction>);
    }
  };

  onCompleteAction = (event: Event<Action>) => {
    if (isPlayerMoveAction(event.data)) {
      this.onPlayerCompleteMove(event.data.entityId);
    }
  };

  async onPlayerStartMove(event: Event<MoveAction>) {
    const broId = this.entityId;
    const { entityId: playerId, targetX, targetY } = event.data;
    const zombieX = getTileX(broId);
    const zombieY = getTileY(broId);

    const playerX = getTileX(playerId);
    const playerY = getTileY(playerId);

    if (targetX !== zombieX || targetY !== zombieY) {
      const points = listPointsInOrthogonalRay(
        zombieX,
        zombieY,
        playerX,
        playerY
      );

      const isLineObstructed = points.some(([x, y]) => {
        return isTileActLike(x, y, WallBehavior, BroBehavior, AirplaneBehavior);
      });

      if (!isLineObstructed && points.length > 0) {
        const [targetX, targetY] = points.shift()!;
        this.velocityX = (targetX - zombieX) as Txps;
        this.velocityY = (targetY - zombieY) as Typs;
      }

      if (!hasActionsInProgress(broId)) {
        const { velocityX, velocityY } = this;
        const zombieX = getTileX(broId);
        const zombieY = getTileY(broId);
        const action = new MoveAction(
          broId,
          zombieX,
          zombieY,
          (zombieX + velocityX) as TilesX,
          (zombieY + velocityY) as TilesY
        );
        tryAction(action, false);
      }
    }
  }

  onPlayerCompleteMove(playerId: number) {
    const broId = this.entityId;
    const broX = getTileX(broId);
    const broY = getTileY(broId);

    const playerX = getTileX(playerId);
    const playerY = getTileY(playerId);

    if (playerX === broX && playerY === broY) {
      enqueueAction(new KillPlayerAction(playerId, broId, GAME_OVER_TEXT));
    }
  }
}
