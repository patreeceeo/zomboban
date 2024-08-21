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
import { ITilesState } from "../systems/TileSystem";
import { IEntityPrefabState } from "../entities";

type Context = InputState &
  CameraState &
  ITilesState &
  TimeState &
  IEntityPrefabState &
  MetaState &
  EntityManagerState;
type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof AnimationComponent
>;

export class CursorBehavior extends Behavior<Entity, Context> {
  onEnter(entity: Entity, context: Context) {
    return [new ControlCameraAction(entity, context.time)];
  }
  onUpdateLate(entity: Entity, context: Context) {
    if (entity.actions.size > 0) {
      return;
    }
    const { inputPressed } = context;

    const { position } = entity.transform;

    const { time } = context;

    // TODO: try eliminating these conditionals with state design pattern
    switch (context.metaStatus) {
      case MetaStatus.Edit:
        switch (inputPressed) {
          case Key.r:
            context.metaStatus = MetaStatus.Replace;
            return [new SetAnimationClipAction(entity, time, "replace")];
          case Key.x: {
            // TODO add support for masks so that the cursor can have a tile position component without interfering with game entities.
            const tileX = convertToTiles(position.x);
            const tileY = convertToTiles(position.y);
            const tileZ = convertToTiles(position.z);
            const nttAtCursor = context.tiles.get(tileX, tileY, tileZ);
            const nttBelowCursor = context.tiles.get(tileX, tileY, tileZ - 1);
            if (nttAtCursor !== undefined) {
              // log.append(
              //   `Deleting entity ${nttUnderCursor} from (${tileX}, ${tileY}, ${tileZ})`
              // );
              return [new RemoveEntitiesAction(entity, time, nttAtCursor)];
            }
            if (nttBelowCursor !== undefined) {
              return [new RemoveEntitiesAction(entity, time, nttBelowCursor)];
            }
            break;
          }
          default:
            if (inputPressed in KEY_MAPS.MOVE) {
              const move = new MoveAction(
                entity,
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
            return [new SetAnimationClipAction(entity, time, "normal")];
          default:
            if (inputPressed in KEY_MAPS.CREATE_PREFEB) {
              const prefabId = KEY_MAPS.CREATE_PREFEB[inputPressed as Key];
              const prefab = context.entityPrefabMap.get(prefabId)!;
              const tileX = convertToTiles(position.x);
              const tileY = convertToTiles(position.y);
              const tileZ = convertToTiles(position.z);
              const nttUnderCursor = context.tiles.get(tileX, tileY, tileZ);
              context.metaStatus = MetaStatus.Edit;
              return [
                new SetAnimationClipAction(entity, time, "normal"),
                ...(nttUnderCursor !== undefined
                  ? [new RemoveEntitiesAction(entity, time, nttUnderCursor)]
                  : []),
                new CreateEntityAction(
                  entity,
                  time,
                  prefab,
                  entity.transform.position
                )
              ];
            }
        }
    }
  }
}
