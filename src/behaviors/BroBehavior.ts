import type { PlayerBehavior } from ".";
import {
  Event,
  EventType,
  addEventListener,
  removeEventListener,
} from "../Event";
import { getTileX, getTileY, queryTile } from "../Tile";
import { MoveAction } from "../actions/MoveAction";
import {
  ActLike,
  Behavior,
  getActLike,
  isActLike,
} from "../components/ActLike";
import { setText } from "../components/Text";
import { listPointsInOrthogonalRay } from "../functions/OrthogonalRay";
import { tryAction } from "../functions/tryAction";
import { SCENE_MANAGER, SharedEntity } from "../scenes";
import { GAME_OVER_TEXT_ID } from "../scenes/GameOverScene";
import { Action, hasActionsInProgress } from "../systems/ActionSystem";

function isTileActLike(
  tileX: number,
  tileY: number,
  actLikeMask: number,
): boolean {
  const objectIds = queryTile(tileX as TilesX, tileY as TilesY);
  const result = objectIds.some((id) => isActLike(id, actLikeMask));
  return result;
}

const GAME_OVER_TEXT = "“Resistance is futile”, bro!";

if (import.meta.hot) {
  import.meta.hot.accept((module) => {
    if (!module) {
      import.meta.hot!.invalidate();
      return;
    }
    setText(
      SCENE_MANAGER.getSharedEntity(SharedEntity.GAME_OVER_TEXT),
      module.GAME_OVER_TEXT,
    );
  });
}

function isPlayerMoveAction(action: Action): action is MoveAction {
  return (
    action instanceof MoveAction && isActLike(action.entityId, ActLike.PLAYER)
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

  toString() {
    return "BRO";
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
        playerY,
      );

      const isLineObstructed = points.some(([x, y]) => {
        return isTileActLike(
          x,
          y,
          ActLike.GAME_OBJECT & ~ActLike.BOX & ~ActLike.PLAYER,
        );
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
          (zombieY + velocityY) as TilesY,
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
      const playerBehavior = getActLike(playerId);
      setText(GAME_OVER_TEXT_ID, GAME_OVER_TEXT);
      (playerBehavior as PlayerBehavior).die(broId);
    }
  }
}
