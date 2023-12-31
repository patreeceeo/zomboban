import { executeFilterQuery } from "../Query";
import {
  getCollisions,
  isTileOccupied,
  placeObjectInTile,
  queryTile,
  resetCollisions,
  resetTiles,
} from "../Tile";
import { MoveAction } from "../actions/MoveAction";
import { SmashPotion } from "../actions/SmashPotion";
import { ActLike, isActLike } from "../components/ActLike";
import { Layer, getLayer } from "../components/Layer";
import { hasPosition } from "../components/Position";
import { addAction, getActions as listActions } from "./ActionSystem";

/** @fileoverview
 * Responsible for creating move actions. Move actions are created when either:
 * - an entity has non-zero velocity
 * - an entity is pushed by another entity
 */

const entityIds: number[] = [];

function isOnObjectLayer(id: number): boolean {
  return getLayer(id) === Layer.OBJECT;
}

function listPositionedObjects(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((id: number) => {
    return isOnObjectLayer(id) && hasPosition(id);
  }, entityIds);
}

function isPusher(id: number): boolean {
  return isActLike(id, ActLike.PLAYER | ActLike.ZOMBIE);
}
function isPushable(id: number): boolean {
  return isActLike(id, ActLike.PUSHABLE);
}

export function isMoveBlocked(
  tileX: TilesX,
  tileY: TilesY,
  txps: Txps,
  typs: Typs,
): boolean {
  const targetX = (tileX + txps) as TilesX;
  const targetY = (tileY + typs) as TilesY;
  const tileIds = queryTile(targetX, targetY);

  return (
    tileIds.some((id) =>
      isActLike(id, ActLike.ANY_GAME_OBJECT & ~ActLike.PUSHABLE),
    ) ||
    tileIds.some(
      (id) =>
        isActLike(id, ActLike.PUSHABLE) &&
        isPushableBlocked(targetX, targetY, txps, typs),
    )
  );
}

export function isPushableBlocked(
  targetX: TilesX,
  targetY: TilesY,
  txps: Txps,
  typs: Typs,
): boolean {
  return isTileOccupied((targetX + txps) as TilesX, (targetY + typs) as TilesY);
}

export function initializePhysicsSystem(): void {
  resetTiles();
  for (const id of listPositionedObjects()) {
    placeObjectInTile(id);
  }
}

function addResultingPushActions(action: MoveAction) {
  if (!isPusher(action.entityId)) {
    return;
  }
  const { initialX, initialY, targetX, targetY } = action;
  const velocityX = (targetX - initialX) as Txps;
  const velocityY = (targetY - initialY) as Typs;
  const pushedIds = queryTile(targetX, targetY).filter(isPushable);
  if (!isPushableBlocked(targetX, targetY, velocityX, velocityY)) {
    for (const pushedId of pushedIds) {
      addAction(
        new MoveAction(
          pushedId,
          targetX,
          targetY,
          (targetX + velocityX) as TilesX,
          (targetY + velocityY) as TilesY,
        ),
      );
    }
  }
}

function handleCollisions() {
  const collisions = getCollisions();
  for (const collision of collisions) {
    const { entityId, otherIds } = collision;
    if (isActLike(entityId, ActLike.POTION)) {
      if (!otherIds.every((id) => isActLike(id, ActLike.PLAYER))) {
        addAction(new SmashPotion(entityId));
      }
    }
  }
}

function listMoveActions() {
  return listActions().filter(
    (action) => action instanceof MoveAction,
  ) as MoveAction[];
}

export function PhysicsSystem(): void {
  for (const action of listMoveActions()) {
    addResultingPushActions(action);
  }
  handleCollisions();
  resetCollisions();
}
