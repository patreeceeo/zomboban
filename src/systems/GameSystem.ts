import { EntityName, getNamedEntity } from "../Entity";
import {
  Key,
  KeyCombo,
  KeyMap,
  createInputQueue,
  includesKey,
  removeKey,
} from "../Input";
import { plotLineSegment } from "../LineSegment";
import { executeFilterQuery } from "../Query";
import { getTileX, getTileY, queryTile } from "../Tile";
import { MoveAction } from "../actions/MoveAction";
import { ThrowPotionAction } from "../actions/ThrowPotion";
import { ActLike, isActLike } from "../components/ActLike";
import { setIsVisible } from "../components/IsVisible";
import { setPixiAppId } from "../components/PixiAppId";
import { setPositionY } from "../components/PositionY";
import { hasText, setText } from "../components/Text";
import { setVelocity } from "../components/Velocity";
import { getPlayerIfExists } from "../functions/Player";
import { addVelocityActions } from "../functions/addVelocityActions";
import { isMoving } from "../functions/isMoving";
import {
  SCREENY_PX,
  convertTxpsToPps,
  convertTypsToPps,
} from "../units/convert";
import { throttle } from "../util";
import {
  addAction,
  applyUndoPoint,
  createUndoPoint,
  hasActionsInProgress,
  hasUndoPoint,
  popUndoPoint,
  pushUndoPoint,
} from "./ActionSystem";
import { followEntityWithCamera } from "./CameraSystem";
import { isMoveBlocked, isPushableBlocked } from "./PhysicsSystem";
import { applyFadeEffect, removeFadeEffect } from "./RenderSystem";

function isTileActLike(
  tileX: number,
  tileY: number,
  actLikeMask: number,
): boolean {
  const objectIds = queryTile(tileX as TilesX, tileY as TilesY);
  return objectIds.some((id) => isActLike(id, actLikeMask));
}

function isLineObstructed(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  actLikeMask: ActLike,
): boolean {
  const dx = endX - startX;
  const dy = endY - startY;
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  if (dx === 0 && dy === 0) {
    return false;
  }
  if (dx === 0 && dy !== 0) {
    for (let y = startY + sy; y !== endY; y += sy) {
      if (isTileActLike(startX, y, actLikeMask)) {
        return true;
      }
    }
    return false;
  }
  if (dx !== 0 && dy === 0) {
    for (let x = startX + sx; x !== endX; x += sx) {
      if (isTileActLike(x, startY, actLikeMask)) {
        return true;
      }
    }
    return false;
  }

  return true;
}

const entityIds: number[] = [];

const MOVEMENT_KEY_MAPS = {
  [Key.a]: [-1, 0],
  [Key.s]: [0, 1],
  [Key.w]: [0, -1],
  [Key.d]: [1, 0],
} as KeyMap<[Txps, Typs]>;

function playerMove(playerId: number, input: KeyCombo) {
  const inputWithoutShift = removeKey(input, Key.Shift);
  if (!(inputWithoutShift in MOVEMENT_KEY_MAPS)) {
    return false;
  }
  const [txps, typs] = MOVEMENT_KEY_MAPS[inputWithoutShift as Key]!;
  const tileX = getTileX(playerId);
  const tileY = getTileY(playerId);
  const nextTileX = (tileX + txps) as TilesX;
  const nextTileY = (tileY + typs) as TilesY;

  if (isMoveBlocked(tileX, tileY, txps, typs)) {
    return false;
  }

  pushUndoPoint(createUndoPoint());

  if (!includesKey(input, Key.Shift)) {
    addAction(new MoveAction(playerId, tileX, tileY, nextTileX, nextTileY));
  } else {
    addAction(new ThrowPotionAction(playerId, txps, typs));
  }
  return true;
}

const INPUT_THROTTLE = 300;

const throttledPlayerMove = throttle(playerMove, INPUT_THROTTLE);

const throttledUndo = throttle(() => {
  applyUndoPoint(popUndoPoint());
}, INPUT_THROTTLE);

function listZombieEntities(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) => isActLike(entityId, ActLike.ZOMBIE),
    entityIds,
  );
}

function listFadeEntities(
  touchingZombieIds: readonly number[],
): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) =>
      !isActLike(entityId, ActLike.PLAYER) &&
      !touchingZombieIds.includes(entityId),
    entityIds,
  );
}

function showTouchZombieMessage(touchingZombieIds: readonly number[]) {
  const touchingZombieTextId = getNamedEntity(EntityName.TOUCHING_ZOMBIE_TEXT);

  if (!hasText(touchingZombieTextId)) {
    const defaultPixiAppId = getNamedEntity(EntityName.DEFAULT_PIXI_APP);
    setPixiAppId(touchingZombieTextId, defaultPixiAppId);
    setText(
      touchingZombieTextId,
      "Steve has you cornered!\n Press Z to rewind.",
    );
    setIsVisible(touchingZombieTextId, false);
    setPositionY(touchingZombieTextId, (SCREENY_PX / 4) as Px);
  }

  // fade everything but the player and the zombie to dark red when the player is touching a zombie
  // TODO: this is a hack, should have a better way to do this
  applyFadeEffect(listFadeEntities(touchingZombieIds));
  setIsVisible(getNamedEntity(EntityName.TOUCHING_ZOMBIE_TEXT), true);
}

function hideTouchZombieMessage() {
  // TODO: this is a hack, should have a better way to do this
  removeFadeEffect(listFadeEntities([]));
  setIsVisible(getNamedEntity(EntityName.TOUCHING_ZOMBIE_TEXT), false);
}

function hideOverlays() {
  hideTouchZombieMessage();
}

export function stopGameSystem() {
  hideOverlays();
}

const inputQueue = createInputQueue();

function listMovingObjects(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((id: number) => {
    return isMoving(id);
  }, entityIds);
}

export function GameSystem() {
  const maybePlayerId = getPlayerIfExists();
  if (maybePlayerId === undefined) {
    return false;
  }
  const playerId = maybePlayerId!;
  const playerX = getTileX(playerId);
  const playerY = getTileY(playerId);

  followEntityWithCamera(playerId);

  const touchingZombieIds = queryTile(playerX, playerY).filter((id) =>
    isActLike(id, ActLike.ZOMBIE),
  );
  if (touchingZombieIds.length === 0) {
    hideTouchZombieMessage();
  } else {
    showTouchZombieMessage(touchingZombieIds);
  }

  if (hasActionsInProgress()) {
    return false;
  }

  const input = inputQueue.shift();
  if (input === undefined) {
    throttledPlayerMove.cancel();
    throttledUndo.cancel();
  } else {
    const maybePlayerId = getPlayerIfExists();
    if (maybePlayerId === undefined) {
      return false;
    }
    const playerId = maybePlayerId!;
    const playerX = getTileX(playerId);
    const playerY = getTileY(playerId);

    if (includesKey(input!, Key.z)) {
      if (hasUndoPoint() && !hasActionsInProgress()) {
        throttledUndo();
      }
    } else if (
      touchingZombieIds.length === 0 &&
      throttledPlayerMove(playerId, input)
    ) {
      for (const zombieId of listZombieEntities()) {
        const zombieX = getTileX(zombieId);
        const zombieY = getTileY(zombieId);

        if (
          !isLineObstructed(
            zombieX,
            zombieY,
            playerX,
            playerY,
            ActLike.ANY_GAME_OBJECT & ~ActLike.PUSHABLE,
          )
        ) {
          // TODO use simplified line segment algorithm
          const lineSegment = plotLineSegment(
            zombieX,
            zombieY,
            playerX,
            playerY,
          );
          lineSegment.next();
          const lineSegmentResult = lineSegment.next();
          if (!lineSegmentResult.done) {
            const [targetX, targetY] = lineSegmentResult.value;
            const txps = (targetX - zombieX) as Txps;
            const typs = (targetY - zombieY) as Typs;
            if (
              !(
                queryTile(targetX as TilesX, targetY as TilesY).some((id) =>
                  isActLike(id, ActLike.PUSHABLE),
                ) &&
                isPushableBlocked(
                  targetX as TilesX,
                  targetY as TilesY,
                  txps,
                  typs,
                )
              )
            ) {
              setVelocity(
                zombieId,
                convertTxpsToPps(txps),
                convertTypsToPps(typs),
              );
            }
          }
        }
      }
      for (const id of listMovingObjects()) {
        addVelocityActions(id);
      }
    }
  }
}
