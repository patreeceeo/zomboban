import { EntityWithComponents } from "../Component";
import {
  AnimationComponent,
  BehaviorComponent,
  LevelIdComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { Behavior } from "../systems/BehaviorSystem";
import {
  MoveAction
} from "../actions";
import {
  MetaStatus,
  State,
} from "../state";
import { Key } from "../Input";
import { convertToTiles } from "../units/convert";
import { KEY_MAPS } from "../constants";
import { HeadingDirection } from "../HeadingDirection";
import {IEntityPrefab} from "../EntityPrefab";
import {ReadonlyVector3} from "../functions/Vector3";
import {EditorSystem } from "../systems/EditorSystem";
import {EditorCommand} from "../editor_commands";
import {TileSystem} from "../systems/TileSystem";
import { setAnimationClip } from "../util";
import { createOrthographicCamera } from "../systems/RenderSystem";

type Context = State;

type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof AnimationComponent
>;

const MOVE_DURATION = 200;

class CursorBehavior extends Behavior<Entity, Context> {
  onEnter(entity: Entity, context: Context) {
    context.camera = createOrthographicCamera();
    context.cameraTarget = entity.transform.position;
    context.cameraOffset.set(0, -450, 1000);
    return [];
  }
  onExit(_: Entity, context: Context) {
    context.camera = undefined;
  }
  onUpdateLate(cursor: Entity, context: Context) {
    if (cursor.actions.size > 0) {
      return;
    }
    const inputPressed = context.inputPressed;

    const { position } = cursor.transform;

    const { time } = context;

    // TODO: try eliminating these conditionals with state design pattern
    switch (context.metaStatus) {
      case MetaStatus.Edit:
        switch (inputPressed) {
          case KEY_MAPS.EDITOR_REPLACE_MODE:
            context.metaStatus = MetaStatus.Replace;
            setAnimationClip(cursor, "replace");
            return [];
          case KEY_MAPS.EDITOR_DELETE: {
            // TODO add support for masks so that the cursor can have a tile position component without interfering with game entities.
            const tileX = convertToTiles(position.x);
            const tileY = convertToTiles(position.y);
            const tileZ = convertToTiles(position.z);
            const nttAtCursor = context.tiles.getRegularNtts(tileX, tileY, tileZ);
            for(const ntt of nttAtCursor) {
              removeEntity(context, ntt);
            }

            if(nttAtCursor.size === 0) {
              const platformNtt = context.tiles.getPlatformNtt(tileX, tileY, tileZ);
              if(platformNtt) {
                removeEntity(context, platformNtt);
              }
            }

            break;
          }
          default:
            if (inputPressed in KEY_MAPS.MOVE) {
              const move = new MoveAction(
                cursor,
                time,
                MOVE_DURATION,
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
            setAnimationClip(cursor, "normal");
            return [];
          default:
            if (inputPressed in KEY_MAPS.CREATE_PREFEB) {
              const prefabId = KEY_MAPS.CREATE_PREFEB[inputPressed as Key];
              const prefab = context.entityPrefabMap.get(prefabId)!;
              const tileX = convertToTiles(position.x);
              const tileY = convertToTiles(position.y);
              const tileZ = convertToTiles(position.z);
              const { tiles } = context;

              context.metaStatus = MetaStatus.Edit;

              if(!prefab.isPlatform) {
                const nttUnderCursor = tiles.getRegularNtts(tileX, tileY, tileZ);

                for(const ntt of nttUnderCursor) {
                  removeEntity(context, ntt);
                }
              } else {
                const nttUnderCursor = tiles.getPlatformNtt(tileX, tileY, tileZ);

                if(nttUnderCursor) {
                  removeEntity(context, nttUnderCursor);
                }
              }

              createEntity(context, prefab, position);

              setAnimationClip(cursor, "normal");
              return [];
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
  const hasTilePosition = TilePositionComponent.has(entity);
  if (hasTransform) {
    const { position: createdEntityPosition } = entity.transform;
    // Don't overwrite the Z position, as it may be set by the prefab.
    createdEntityPosition.x = position.x;
    createdEntityPosition.y = position.y;
    createdEntityPosition.z = prefab.isPlatform ? -64 : 0;

    if (hasTilePosition) {
      TileSystem.syncEntity(entity);
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

export default CursorBehavior;
