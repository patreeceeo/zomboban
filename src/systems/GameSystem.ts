import { Key, KeyMap, isKeyDown } from "../Input";
import { plotLineSegment } from "../LineSegment";
import { executeFilterQuery } from "../Query";
import { ActLike, isActLike } from "../components/ActLike";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { shouldSave } from "../components/ShouldSave";
import { setToBeRemoved } from "../components/ToBeRemoved";
import { setVelocity } from "../components/Velocity";
import { getPlayerIfExists } from "../functions/Player";
import { loadComponents } from "../functions/loadComponents";
import {
  convertPixelsToTilesX,
  convertPixelsToTilesY,
  convertTxpsToPps,
  convertTypsToPps,
} from "../units/convert";
import { throttle } from "../util";
import { isLineObstructed, initializePhysicsSystem } from "./PhysicsSystem";
import { setRenderStateDirty } from "./RenderSystem";

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
} as KeyMap<[Txps, Txps]>;

const MOVEMENT_KEYS = Object.keys(MOVEMENT_KEY_MAPS) as Key[];

function movePlayerByTiles(playerId: number, dx: Txps, dy: Txps) {
  setVelocity(playerId, convertTxpsToPps(dx), convertTypsToPps(dy));
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
  const playerX = Math.round(convertPixelsToTilesX(getPositionX(playerId)));
  const playerY = Math.round(convertPixelsToTilesY(getPositionY(playerId)));

  if (turn === Turn.PLAYER) {
    let newVelocityX = 0 as Txps;
    let newVelocityY = 0 as Txps;
    const movementKeyMask = calcMovementKeyMask();
    for (const key of MOVEMENT_KEYS) {
      if (isKeyDown(key)) {
        const [dx, dy] = MOVEMENT_KEY_MAPS[key]!;
        newVelocityX = (newVelocityX + dx) as Txps;
        newVelocityY = (newVelocityY + dy) as Txps;
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
      const zombieX = Math.round(convertPixelsToTilesX(getPositionX(zombieId)));
      const zombieY = Math.round(convertPixelsToTilesY(getPositionY(zombieId)));

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
          const dx = (targetX - zombieX) as Txps;
          const dy = (targetY - zombieY) as Txps;
          setVelocity(zombieId, convertTxpsToPps(dx), convertTypsToPps(dy));
        }
      }
    }
    turn = Turn.PLAYER;
  }
}
