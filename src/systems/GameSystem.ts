import { Key, KeyMap, isAnyKeyDown, isKeyDown } from "../Input";
import { plotLineSegment } from "../LineSegment";
import { executeFilterQuery } from "../Query";
import { ActLike, isActLike } from "../components/ActLike";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { shouldSave } from "../components/ShouldSave";
import { SPRITE_SIZE } from "../components/Sprite";
import { setToBeRemoved } from "../components/ToBeRemoved";
import { setVelocity } from "../components/Velocity";
import { getPlayerIfExists } from "../functions/Player";
import { loadComponents } from "../functions/loadComponents";
import { throttle } from "../util";
import { isLineObstructed, initializePhysicsSystem } from "./PhysicsSystem";
import { setRenderStateDirty } from "./RenderSystem";

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

function listLevelEntities(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((entityId) => shouldSave(entityId), entityIds);
}

function clearLevel() {
  for (const entityId of listLevelEntities()) {
    setToBeRemoved(entityId, true);
  }
}

let turn = Turn.PLAYER;
let lastMovementKeyMask = 0;

function calcMovementKeyMask(): number {
  let mask = 0;
  for (const [index, key] of MOVEMENT_KEYS.entries()) {
    if (isKeyDown(key)) {
      mask |= 1 << index;
    }
  }
  return mask;
}

export function GameSystem() {
  const maybePlayerId = getPlayerIfExists();
  if (maybePlayerId === undefined) {
    // show gameover?
    loadComponents();
    initializePhysicsSystem();
    setRenderStateDirty();
    return false;
  }
  const playerId = maybePlayerId!;
  const playerX = Math.round(getPositionX(playerId) / SPRITE_SIZE);
  const playerY = Math.round(getPositionY(playerId) / SPRITE_SIZE);

  if (turn === Turn.PLAYER) {
    let newVelocityX = 0;
    let newVelocityY = 0;
    const movementKeyMask = calcMovementKeyMask();
    for (const key of MOVEMENT_KEYS) {
      if (isKeyDown(key)) {
        const [dx, dy] = MOVEMENT_KEY_MAPS[key]!;
        newVelocityX += dx;
        newVelocityY += dy;
      }
    }
    if (movementKeyMask !== 0 && movementKeyMask === lastMovementKeyMask) {
      throttledMovePlayerByTiles(playerId, newVelocityX, newVelocityY);
    } else {
      throttledMovePlayerByTiles.cancel();
    }
    lastMovementKeyMask = movementKeyMask;
  }

  if (turn === Turn.ZOMBIE) {
    for (const zombieId of listZombieEntities()) {
      const zombieX = Math.round(getPositionX(zombieId) / SPRITE_SIZE);
      const zombieY = Math.round(getPositionY(zombieId) / SPRITE_SIZE);

      if (
        Math.abs(zombieX - playerX) <= 1 &&
        Math.abs(zombieY - playerY) <= 1 &&
        !isLineObstructed(
          zombieX,
          zombieY,
          playerX,
          playerY,
          ActLike.PUSHABLE | ActLike.BARRIER,
        )
      ) {
        clearLevel();
        break;
      } else if (
        !isLineObstructed(
          zombieX,
          zombieY,
          playerX,
          playerY,
          ActLike.PUSHABLE | ActLike.BARRIER,
        )
      ) {
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
