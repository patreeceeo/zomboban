import { EntityName, addEntity, getNamedEntity } from "../Entity";
import { Key, KeyMap, getLastKeyDown, isKeyDown } from "../Input";
import { plotLineSegment } from "../LineSegment";
import { executeFilterQuery } from "../Query";
import {
  getTileX,
  getTileY,
  listAdjacentTileEntities,
  queryTile,
} from "../Tile";
import { hasUndo, popUndo, pushEmptyUndo } from "../Undo";
import { ActLike, isActLike, setActLike } from "../components/ActLike";
import { setIsVisible } from "../components/IsVisible";
import { setLookLike } from "../components/LookLike";
import { setPixiAppId } from "../components/PixiAppId";
import { setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY, setPositionY } from "../components/PositionY";
import { hasText, setText } from "../components/Text";
import { setToBeRemoved } from "../components/ToBeRemoved";
import { setVelocity } from "../components/Velocity";
import { getVelocityX } from "../components/VelocityX";
import { getVelocityY } from "../components/VelocityY";
import { getPlayerIfExists } from "../functions/Player";
import { createPotion } from "../functions/createPotion";
import {
  SCREENY_PX,
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
    createPotion(id);
    setPosition(id, getPositionX(playerId), getPositionY(playerId));
    setVelocity(id, velocityX, velocityY);
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

function listPotionEntities(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) => isActLike(entityId, ActLike.POTION),
    entityIds,
  );
}

let turn = Turn.PLAYER;
let lastMovementKey: Key;
let previousPlayerX: TilesX;
let previousPlayerY: TilesY;
let wasUndoing = false;

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

let score = 0;
function showScore() {
  const scoreTextId = getNamedEntity(EntityName.SCORE_TEXT);

  if (!hasText(scoreTextId)) {
    const defaultPixiAppId = getNamedEntity(EntityName.DEFAULT_PIXI_APP);
    setPixiAppId(scoreTextId, defaultPixiAppId);
    setPositionY(scoreTextId, (SCREENY_PX * (1 / 40)) as Px);
  }
  setIsVisible(scoreTextId, true);
  setText(scoreTextId, `Rescued ${score}`);
}

function hideTouchZombieMessage() {
  // TODO: this is a hack, should have a better way to do this
  removeFadeEffect(listFadeEntities([]));
  setIsVisible(getNamedEntity(EntityName.TOUCHING_ZOMBIE_TEXT), false);
}

function hideOverlays() {
  setIsVisible(getNamedEntity(EntityName.SCORE_TEXT), false);
  hideTouchZombieMessage();
}

export function stopGameSystem() {
  hideOverlays();
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

  showScore();

  const unzombiesAtPlayerPosition = queryTile(playerX, playerY).filter((id) =>
    isActLike(id, ActLike.UNZOMBIE),
  );
  for (const id of unzombiesAtPlayerPosition) {
    score++;
    setToBeRemoved(id, true);
  }

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
        wasUndoing = true;
      }
    } else {
      throttledUndo.cancel();
      if (previousPlayerX !== playerX || previousPlayerY !== playerY) {
        if (previousPlayerX !== undefined || previousPlayerY !== undefined) {
          turn = Turn.ZOMBIE;
        }
      }
      // reverse the velocity of any potions because if we were undoing, they're still moving backwards
      if (wasUndoing) {
        wasUndoing = false;
        for (const potionId of listPotionEntities()) {
          setVelocity(
            potionId,
            -getVelocityX(potionId) as Pps,
            -getVelocityY(potionId) as Pps,
          );
        }
      }
    }
  }

  if (turn === Turn.ZOMBIE) {
    for (const zombieId of listZombieEntities()) {
      const zombieX = getTileX(zombieId);
      const zombieY = getTileY(zombieId);

      const potionsAtZombiePosition = queryTile(zombieX, zombieY).some((id) =>
        isActLike(id, ActLike.POTION),
      );

      if (potionsAtZombiePosition) {
        setActLike(zombieId, ActLike.UNZOMBIE);
        setLookLike(zombieId, getNamedEntity(EntityName.UNZOMBIE_ANIMATION));
      }

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
