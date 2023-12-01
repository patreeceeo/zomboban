import { Key, KeyMap, getLastKeyDown, isKeyDown } from "../Input";
import { plotLineSegment } from "../LineSegment";
import { executeFilterQuery } from "../Query";
import { getTileX, getTileY } from "../Tile";
import { clearUndo, hasUndo, popUndo, pushUndo } from "../Undo";
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
import {
  isLineObstructed,
  initializePhysicsSystem,
  attemptPush,
} from "./PhysicsSystem";
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
} as KeyMap<[Txps, Typs]>;

function movePlayer(playerId: number, velocityX: Pps, velocityY: Pps) {
  setVelocity(playerId, velocityX, velocityY);
  attemptPush(playerId, velocityX, velocityY);
  turn = Turn.ZOMBIE;
}

const throttledMovePlayer = throttle(movePlayer, 700);

const throttledUndo = throttle(() => {
  popUndo(listUndoEntities());
}, 700);

function listZombieEntities(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) => isActLike(entityId, ActLike.ZOMBIE),
    entityIds,
  );
}

function listUndoEntities(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) =>
      isActLike(entityId, ActLike.ZOMBIE | ActLike.PUSHABLE | ActLike.PLAYER),
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
let lastMovementKey: Key;

export function GameSystem() {
  const maybePlayerId = getPlayerIfExists();
  if (maybePlayerId === undefined) {
    // show gameover?
    loadComponents();
    initializePhysicsSystem();
    setRenderStateDirty();
    clearUndo();
    return false;
  }
  const playerId = maybePlayerId!;
  const playerX = getTileX(playerId);
  const playerY = getTileY(playerId);

  if (turn === Turn.PLAYER) {
    const lastKeyDown = getLastKeyDown();
    if (lastKeyDown! in MOVEMENT_KEY_MAPS) {
      lastMovementKey = lastKeyDown!;
    }
    if (isKeyDown(lastMovementKey)) {
      const [txps, typs] = MOVEMENT_KEY_MAPS[lastMovementKey]!;
      throttledMovePlayer(
        playerId,
        convertTxpsToPps(txps),
        convertTypsToPps(typs),
      );
    } else {
      throttledMovePlayer.cancel();
    }

    if (isKeyDown(Key.z) && hasUndo()) {
      throttledUndo();
    } else {
      throttledUndo.cancel();
    }
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

    pushUndo(listUndoEntities());
    turn = Turn.PLAYER;
  }
}
