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
import { UnzombifyAction } from "../actions/UnzombifyAction";
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

export function isBlockedByBarrier(targetX: TilesX, targetY: TilesY): boolean {
  return queryTile(targetX, targetY).some((id) =>
    isActLike(id, ActLike.BARRIER),
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

function handlePotions() {
  const collisions = getCollisions();
  for (const collision of collisions) {
    const { entityId, otherIds } = collision;
    if (isActLike(entityId, ActLike.POTION)) {
      if (!otherIds.every((id) => isActLike(id, ActLike.PLAYER))) {
        addAction(new SmashPotion(entityId));
      }
      if (otherIds.every((id) => isActLike(id, ActLike.ZOMBIE))) {
        for (const id of otherIds) {
          addAction(new UnzombifyAction(id));
        }
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
  handlePotions();
  resetCollisions();
}
