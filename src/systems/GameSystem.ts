import { Key, KeyMap, getLastKeyDown, isAnyKeyDown } from "../Input";
import { plotLineSegment } from "../LineSegment";
import { executeFilterQuery } from "../Query";
import { ActLike, isActLike } from "../components/ActLike";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { SPRITE_SIZE } from "../components/Sprite";
import { setVelocity } from "../components/Velocity";
import { getPlayerIfExists } from "../functions/Player";
import { throttle } from "../util";
import { getObjectsAt } from "./PhysicsSystem";

const entityIds: number[] = [];

const enum Turn {
  PLAYER,
  ZOMBIE,
}

const MOVEMENT_KEY_MAPS: KeyMap<[number, number]> = {
  [Key.a]: [-1, 0],
  [Key.s]: [0, 1],
  [Key.w]: [0, -1],
  [Key.d]: [1, 0],
};

const MOVEMENT_KEYS = Object.keys(MOVEMENT_KEY_MAPS) as Key[];

function movePlayerByTiles(playerId: number, dx: number, dy: number) {
  setVelocity(playerId, dx * SPRITE_SIZE, dy * SPRITE_SIZE);
  turn = Turn.ZOMBIE;
}

const throttledMovePlayerByTiles = throttle(movePlayerByTiles, 700);

function listZombieEntities(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) => isActLike(entityId, ActLike.ZOMBIE),
    entityIds,
  );
}

const getObjectsResult: number[] = [];
function hasOpaqueObject(tileX: number, tileY: number): boolean {
  getObjectsResult.length = 0;
  const objectIds = getObjectsAt(tileX, tileY, getObjectsResult);
  for (const objectId of objectIds) {
    if (
      isActLike(objectId, ActLike.BARRIER) ||
      isActLike(objectId, ActLike.PUSHABLE)
    ) {
      return true;
    }
  }
  return false;
}

export function canZombieSee(
  zombieX: number,
  zombieY: number,
  targetX: number,
  targetY: number,
): boolean {
  const lineSegment = plotLineSegment(zombieX, zombieY, targetX, targetY);
  for (const [tileX, tileY] of lineSegment) {
    if (tileX === targetX && tileY === targetY) {
    }
    if (tileX === zombieX && tileY === zombieY) {
    }
    if (hasOpaqueObject(tileX, tileY)) {
      return false;
    }
    if (
      tileX !== zombieX &&
      tileY !== zombieY &&
      tileX !== targetX &&
      tileY !== targetY
    ) {
      let count = 0;
      if (hasOpaqueObject(tileX - 1, tileY)) {
        count++;
      }
      if (hasOpaqueObject(tileX + 1, tileY)) {
        count++;
      }
      if (hasOpaqueObject(tileX, tileY - 1)) {
        count++;
      }
      if (hasOpaqueObject(tileX, tileY + 1)) {
        count++;
      }
      if (count > 1) {
        return false;
      }
    }
  }
  return true;
}

let turn = Turn.PLAYER;

export function GameSystem() {
  const maybePlayerId = getPlayerIfExists();
  if (maybePlayerId === undefined) {
    // show gameover?
    return false;
  }
  const playerId = maybePlayerId!;
  const lastKeyDown = getLastKeyDown()!;
  const playerX = Math.round(getPositionX(playerId) / SPRITE_SIZE);
  const playerY = Math.round(getPositionY(playerId) / SPRITE_SIZE);

  if (turn === Turn.PLAYER) {
    if (MOVEMENT_KEYS.includes(lastKeyDown) && isAnyKeyDown(MOVEMENT_KEYS)) {
      const [dx, dy] = MOVEMENT_KEY_MAPS[lastKeyDown]!;
      throttledMovePlayerByTiles(playerId, dx, dy);
    } else {
      throttledMovePlayerByTiles.cancel();
    }
  }

  if (turn === Turn.ZOMBIE) {
    for (const zombieId of listZombieEntities()) {
      const zombieX = Math.round(getPositionX(zombieId) / SPRITE_SIZE);
      const zombieY = Math.round(getPositionY(zombieId) / SPRITE_SIZE);

      if (canZombieSee(zombieX, zombieY, playerX, playerY)) {
        const lineSegment = plotLineSegment(zombieX, zombieY, playerX, playerY);
        lineSegment.next();
        const lineSegmentResult = lineSegment.next();
        if (!lineSegmentResult.done) {
          const [targetX, targetY] = lineSegmentResult.value;
          const dx = targetX - zombieX;
          const dy = targetY - zombieY;
          setVelocity(zombieId, dx * SPRITE_SIZE, dy * SPRITE_SIZE);
        }
      }
    }
    turn = Turn.PLAYER;
  }
}
