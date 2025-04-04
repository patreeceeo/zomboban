import { EntityWithComponents } from "../Component";
import {
  AnimationComponent,
  BehaviorComponent,
  TransformComponent
} from "../components";
import { Behavior } from "../systems/BehaviorSystem";
import {
  ControlCameraAction,
  CreateEntityAction,
  MoveAction,
  RemoveEntitiesAction,
  SetAnimationClipAction
} from "../actions";
import {
  CameraState,
  ClientState,
  EntityManagerState,
  InputState,
  MetaState,
  MetaStatus,
  TimeState
} from "../state";
import { Key } from "../Input";
import { convertToTiles } from "../units/convert";
import { KEY_MAPS } from "../constants";
import { HeadingDirection } from "../HeadingDirection";
import { ITilesState, TileEntity } from "../systems/TileSystem";
import { IEntityPrefabState } from "../entities";

type Context = InputState &
  CameraState &
  ITilesState &
  TimeState &
  IEntityPrefabState &
  MetaState &
  EntityManagerState &
  ClientState;
type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof AnimationComponent
>;

export class CursorBehavior extends Behavior<Entity, Context> {
  onEnter(entity: Entity, context: Context) {
    return [new ControlCameraAction(entity, context.time)];
  }

  _removeEntities(cursor: Entity, context: Context, entitiesToRemove: ReadonlySet<TileEntity>) {
    return [new RemoveEntitiesAction(cursor, context.time, entitiesToRemove, true)];
  }

  onUpdateLate(cursor: Entity, context: Context) {
    if (cursor.actions.size > 0) {
      return;
    }
    const { inputPressed } = context;

    const { position } = cursor.transform;

    const { time } = context;

    // TODO: try eliminating these conditionals with state design pattern
    switch (context.metaStatus) {
      case MetaStatus.Edit:
        switch (inputPressed) {
          case Key.r:
            context.metaStatus = MetaStatus.Replace;
            return [new SetAnimationClipAction(cursor, time, "replace")];
          case Key.x: {
            // TODO add support for masks so that the cursor can have a tile position component without interfering with game entities.
            const tileX = convertToTiles(position.x);
            const tileY = convertToTiles(position.y);
            const tileZ = convertToTiles(position.z);
            const nttAtCursor = context.tiles.getEnts(tileX, tileY, tileZ);
            const nttBelowCursor = context.tiles.getEnts(
              tileX,
              tileY,
              tileZ - 1
            );
            if (nttAtCursor !== undefined) {
              return this._removeEntities(cursor, context, nttAtCursor);
            }
            // TODO remove once the cursor can be moved along Z axis
            if (nttBelowCursor !== undefined) {
              return this._removeEntities(cursor, context, nttBelowCursor);
            }
            break;
          }
          default:
            if (inputPressed in KEY_MAPS.MOVE) {
              const move = new MoveAction(
                cursor,
                time,
                HeadingDirection.getVector(KEY_MAPS.MOVE[inputPressed as Key])
              );
              return [move];
            }
        }
        break;
      case MetaStatus.Replace:
        switch (inputPressed) {
          case Key.Escape:
            context.metaStatus = MetaStatus.Edit;
            return [new SetAnimationClipAction(cursor, time, "normal")];
          default:
            if (inputPressed in KEY_MAPS.CREATE_PREFEB) {
              const prefabId = KEY_MAPS.CREATE_PREFEB[inputPressed as Key];
              const prefab = context.entityPrefabMap.get(prefabId)!;
              const tileX = convertToTiles(position.x);
              const tileY = convertToTiles(position.y);
              const tileZ = convertToTiles(position.z);
              const nttUnderCursor = context.tiles.getEnts(tileX, tileY, tileZ);
              context.metaStatus = MetaStatus.Edit;
              return [
                new SetAnimationClipAction(cursor, time, "normal"),
                ...(nttUnderCursor !== undefined
                  ? this._removeEntities(cursor, context, nttUnderCursor)
                  : []),
                new CreateEntityAction(
                  cursor,
                  time,
                  prefab,
                  cursor.transform.position,
                  true
                )
              ];
            }
        }
    }
  }
}
