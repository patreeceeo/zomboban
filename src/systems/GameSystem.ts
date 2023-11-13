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

const enum ZombieStep {
  FAVOR_X,
  FAVOR_Y,
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
function hasBarrier(tileX: number, tileY: number): boolean {
  getObjectsResult.length = 0;
  const objectIds = getObjectsAt(tileX, tileY, getObjectsResult);
  for (const objectId of objectIds) {
    if (isActLike(objectId, ActLike.BARRIER)) {
      return true;
    }
  }
  return false;
}

export function canZombieSee(
  zombieX: number,
  zombieY: number,
  tileX: number,
  tileY: number,
): boolean {
  const lineSegment = plotLineSegment(zombieX, zombieY, tileX, tileY);
  for (const [tileX, tileY] of lineSegment) {
    if (hasBarrier(tileX, tileY)) {
      return false;
    }
    let count = 0;
    if (hasBarrier(tileX - 1, tileY) && tileX < tileX) {
      count++;
    }
    if (hasBarrier(tileX + 1, tileY) && tileX > tileX) {
      count++;
    }
    if (hasBarrier(tileX, tileY - 1) && tileY < tileY) {
      count++;
    }
    if (hasBarrier(tileX, tileY + 1) && tileY > tileY) {
      count++;
    }
    if (count > 1) {
      return false;
    }
  }
  return true;
}

let turn = Turn.PLAYER;
let zombieStep = ZombieStep.FAVOR_X;

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
      const diffX = playerX - zombieX;
      const diffY = playerY - zombieY;
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);
      const signDiffX = Math.sign(diffX);
      const signDiffY = Math.sign(diffY);

      if (canZombieSee(zombieX, zombieY, playerX, playerY)) {
        if (absDiffX > absDiffY) {
          setVelocity(zombieId, signDiffX * SPRITE_SIZE, 0);
        }
        if (absDiffX < absDiffY) {
          setVelocity(zombieId, 0, signDiffY * SPRITE_SIZE);
        }
        if (absDiffX === absDiffY) {
          if (zombieStep === ZombieStep.FAVOR_X) {
            setVelocity(zombieId, signDiffX * SPRITE_SIZE, 0);
            zombieStep = ZombieStep.FAVOR_Y;
          }
          if (zombieStep === ZombieStep.FAVOR_Y) {
            setVelocity(zombieId, 0, signDiffY * SPRITE_SIZE);
            zombieStep = ZombieStep.FAVOR_X;
          }
        }
      }
    }
    turn = Turn.PLAYER;
  }
}
