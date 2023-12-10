import { EntityName, addEntity, getNamedEntity } from "../Entity";
import { Key, KeyMap, getLastKeyDown, isKeyDown } from "../Input";
import { plotLineSegment } from "../LineSegment";
import { executeFilterQuery } from "../Query";
import { getTileX, getTileY, listAdjacentTileEntities } from "../Tile";
import { hasUndo, popUndo, pushEmptyUndo } from "../Undo";
import { ActLike, isActLike, setActLike } from "../components/ActLike";
import { setIsVisible } from "../components/IsVisible";
import { Layer, setLayer } from "../components/Layer";
import { setLookLike } from "../components/LookLike";
import { setPixiAppId } from "../components/PixiAppId";
import { setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY, setPositionY } from "../components/PositionY";
import { hasText, setText } from "../components/Text";
import { setVelocity } from "../components/Velocity";
import { getPlayerIfExists } from "../functions/Player";
import {
  SCREENY_PX,
  convertPixelsToTilesX,
  convertPixelsToTilesY,
  convertTxpsToPps,
  convertTypsToPps,
} from "../units/convert";
import { throttle } from "../util";
import { followEntityWithCamera } from "./CameraSystem";
import {
  isLineObstructed,
  requestUndo,
  resetDisplacementTowardLimit,
  suspendUndoTracking,
} from "./PhysicsSystem";
import { applyFadeEffect, removeFadeEffect } from "./RenderSystem";

const entityIds: number[] = [];

const enum Turn {
  PLAYER,
  ZOMBIE,
}

const MOVEMENT_KEY_MAPS = {
  [Key.a]: [-1, 0],
  [Key.s]: [0, 1],
  [Key.w]: [0, -1],
  [Key.d]: [1, 0],
} as KeyMap<[Txps, Typs]>;

function playerMove(
  playerId: number,
  velocityX: Pps,
  velocityY: Pps,
  throwPotion = false,
) {
  if (!throwPotion) {
    setVelocity(playerId, velocityX, velocityY);
    // when moving the player, we have to request the physics system to
    // push an undo item on the stack at just the right time
    requestUndo();
    resetDisplacementTowardLimit();
  } else {
    const id = addEntity();
    pushEmptyUndo();
    setPixiAppId(id, getNamedEntity(EntityName.DEFAULT_PIXI_APP));
    setLayer(id, Layer.OBJECT);
    setPosition(id, getPositionX(playerId), getPositionY(playerId));
    setVelocity(id, velocityX, velocityY);
    setActLike(id, ActLike.POTION);
    setLookLike(id, getNamedEntity(EntityName.POTION_IMAGE));
  }
}

const INPUT_THROTTLE = 300;

const throttledPlayerMove = throttle(playerMove, INPUT_THROTTLE);

const throttledUndo = throttle(() => {
  popUndo(listUndoEntities());
  suspendUndoTracking(true);
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

function listUndoEntities(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) =>
      isActLike(
        entityId,
        ActLike.PLAYER | ActLike.ZOMBIE | ActLike.PUSHABLE | ActLike.POTION,
      ),
    entityIds,
  );
}

let turn = Turn.PLAYER;
let lastMovementKey: Key;
let previousPlayerX: TilesX;
let previousPlayerY: TilesY;

function showTouchZombieMessage(touchingZombieIds: readonly number[]) {
  const touchingZombieTextId = getNamedEntity(EntityName.TOUCHING_ZOMBIE_TEXT);

  if (!hasText(touchingZombieTextId)) {
    const defaultPixiAppId = getNamedEntity(EntityName.DEFAULT_PIXI_APP);
    setPixiAppId(touchingZombieTextId, defaultPixiAppId);
    setText(
      touchingZombieTextId,
      "Sometimes, we must go back to move forward.\n Press z to continue.",
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

export function stopGameSystem() {
  hideTouchZombieMessage();
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

  suspendUndoTracking(false);

  const adjacentTileEntities = listAdjacentTileEntities(playerX, playerY);
  const touchingZombieIds = adjacentTileEntities.filter((id) =>
    isActLike(id, ActLike.ZOMBIE),
  );

  if (turn === Turn.PLAYER) {
    if (touchingZombieIds.length === 0) {
      const lastKeyDown = getLastKeyDown();

      hideTouchZombieMessage();

      if (lastKeyDown! in MOVEMENT_KEY_MAPS) {
        lastMovementKey = lastKeyDown!;
      }
      if (isKeyDown(lastMovementKey)) {
        const [txps, typs] = MOVEMENT_KEY_MAPS[lastMovementKey]!;
        throttledPlayerMove(
          playerId,
          convertTxpsToPps(txps),
          convertTypsToPps(typs),
          isKeyDown(Key.Shift),
        );
      } else {
        throttledPlayerMove.cancel();
      }
    } else {
      showTouchZombieMessage(touchingZombieIds);
    }

    if (isKeyDown(Key.z)) {
      if (hasUndo()) {
        throttledUndo();
      }
    } else {
      throttledUndo.cancel();
      if (previousPlayerX !== playerX || previousPlayerY !== playerY) {
        if (previousPlayerX !== undefined || previousPlayerY !== undefined) {
          turn = Turn.ZOMBIE;
        }
      }
    }
  }

  if (turn === Turn.ZOMBIE) {
    for (const zombieId of listZombieEntities()) {
      const zombieX = Math.round(convertPixelsToTilesX(getPositionX(zombieId)));
      const zombieY = Math.round(convertPixelsToTilesY(getPositionY(zombieId)));

      if (
        !isLineObstructed(zombieX, zombieY, playerX, playerY, ActLike.BARRIER)
      ) {
        // TODO use simplified line segment algorithm
        const lineSegment = plotLineSegment(zombieX, zombieY, playerX, playerY);
        lineSegment.next();
        const lineSegmentResult = lineSegment.next();
        if (!lineSegmentResult.done) {
          const [targetX, targetY] = lineSegmentResult.value;
          const dx = (targetX - zombieX) as Txps;
          const dy = (targetY - zombieY) as Typs;
          setVelocity(zombieId, convertTxpsToPps(dx), convertTypsToPps(dy));
        }
      }
    }

    turn = Turn.PLAYER;
  }
  previousPlayerX = playerX;
  previousPlayerY = playerY;
}
