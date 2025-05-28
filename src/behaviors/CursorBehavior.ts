import { EntityWithComponents } from "../Component";
import {
  AnimationComponent,
  BehaviorComponent,
  LevelIdComponent,
  TransformComponent
} from "../components";
import { Behavior } from "../systems/BehaviorSystem";
import {
  ControlCameraAction,
  MoveAction,
  SetAnimationClipAction
} from "../actions";
import {
  MetaStatus,
  State,
} from "../state";
import { Key } from "../Input";
import { convertToPixels, convertToTiles } from "../units/convert";
import { KEY_MAPS } from "../constants";
import { HeadingDirection } from "../HeadingDirection";
import {IEntityPrefab} from "../EntityPrefab";
import {ReadonlyVector3} from "../functions/Vector3";
import {EditorSystem } from "../systems/EditorSystem";
import {EditorCommand} from "../editor_commands";
import {BehaviorEnum} from ".";

type Context = State;

type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof AnimationComponent
>;

export class CursorBehavior extends Behavior<Entity, Context> {
  onEnter(entity: Entity, context: Context) {
    return [new ControlCameraAction(entity, context.time)];
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
          case KEY_MAPS.EDITOR_REPLACE_MODE:
            context.metaStatus = MetaStatus.Replace;
            return [new SetAnimationClipAction(cursor, time, "replace")];
          case KEY_MAPS.EDITOR_DELETE: {
            // TODO add support for masks so that the cursor can have a tile position component without interfering with game entities.
            const tileX = convertToTiles(position.x);
            const tileY = convertToTiles(position.y);
            const tileZ = convertToTiles(position.z);
            const nttAtCursor = context.tiles.getRegularNtts(tileX, tileY, tileZ);
            for(const ntt of nttAtCursor) {
              removeEntity(context, ntt);
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
          case KEY_MAPS.EDITOR_NORMAL_MODE:
            context.metaStatus = MetaStatus.Edit;
            return [new SetAnimationClipAction(cursor, time, "normal")];
          default:
            if (inputPressed in KEY_MAPS.CREATE_PREFEB) {
              const prefabId = KEY_MAPS.CREATE_PREFEB[inputPressed as Key];
              const prefab = context.entityPrefabMap.get(prefabId)!;
              const tileX = convertToTiles(position.x);
              const tileY = convertToTiles(position.y);
              const tileZ = convertToTiles(position.z);
              const nttUnderCursor = context.tiles.getRegularNtts(tileX, tileY, tileZ);
              context.metaStatus = MetaStatus.Edit;

              createEntity(context, prefab, position);

              for(const ntt of nttUnderCursor) {
                removeEntity(context, ntt);
              }
              return [
                new SetAnimationClipAction(cursor, time, "normal"),
              ];
            }
        }
    }
  }

}

function createEntity(
  state: Context,
  prefab: IEntityPrefab<any>,
  position: ReadonlyVector3
): void {
  const entity = prefab.create(state);
  const hasTransform = TransformComponent.has(entity);
  if (hasTransform) {
    const { position: createdEntityPosition } = entity.transform;
    const hasBehavior = BehaviorComponent.has(entity);

    createdEntityPosition.copy(position);

    // TODO remove once the cursor can be moved along Z axis
    if (
      hasBehavior &&
      entity.behaviorId === BehaviorEnum.ToggleButton
    ) {
      createdEntityPosition.z -= convertToPixels(1 as Tiles);
    }
  }
  LevelIdComponent.add(entity, { levelId: state.currentLevelId });

  EditorSystem.addCommand(state, EditorCommand.PostEntity(state, entity));
}

function removeEntity(
  state: Context,
  entity: any
) {
  EditorSystem.addCommand(state, EditorCommand.DeleteEntity(state, entity));
}
