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
  Mode,
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
import {TileSystem} from "../systems/TileSystem";
import { setAnimationClip } from "../util";
import {JumpToMessage} from "../messages";
import {invariant} from "../Error";
import {Tiles} from "../units/types";
import {getEntityMeta} from "../Entity";

type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof AnimationComponent
>;

const MOVE_DURATION = 200;

class CursorBehavior extends Behavior<Entity, State> {
  onEnter(entity: Entity, context: State) {
    context.render.cameraTarget = entity.transform.position;
    return [];
  }
  onUpdateLate(cursor: Entity, context: State) {
    if (cursor.actions.size > 0) {
      return;
    }
    const inputPressed = context.input.pressed;

    const { position } = cursor.transform;

    const { time } = context.time;

    // TODO add support for masks so that the cursor can have a tile position component without interfering with game entities.
    const tileX = convertToTiles(position.x);
    const tileY = convertToTiles(position.y);
    const tileZ = convertToTiles(position.z);
    const nttAtCursor = context.tiles.getRegularNtts(tileX, tileY, tileZ);

    // TODO: try eliminating these conditionals with state design pattern
    switch (context.mode) {
      case Mode.Edit:
        context.devTools.selectedEntityId = nttAtCursor.size > 0 ? getEntityMeta(nttAtCursor.values().next().value!)?.id : null;
        switch (inputPressed) {
          case KEY_MAPS.EDITOR_REPLACE_MODE:
            context.mode = Mode.Replace;
            setAnimationClip(cursor, "replace");
            return [];
          case KEY_MAPS.EDITOR_DELETE: {
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
      case Mode.Replace:
        switch (inputPressed) {
          case KEY_MAPS.EDITOR_NORMAL_MODE:
            context.mode = Mode.Edit;
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

              context.mode = Mode.Edit;

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

  messageHandlers = {
    [JumpToMessage.type]: (entity: Entity, state: State, message: JumpToMessage) => {
      invariant(state.mode === Mode.Edit, "JumpToMessage can only be handled in Edit mode");
      const {tilePosition} = message.sender;
      entity.transform.position.set(convertToPixels(tilePosition.x as Tiles), convertToPixels(tilePosition.y as Tiles), 0);
    }
  }

}

function createEntity(
  state: State,
  prefab: IEntityPrefab<any>,
  position: ReadonlyVector3
): void {
  const entity = prefab.create(state.world);
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
  state: State,
  entity: any
) {
  EditorSystem.addCommand(state, EditorCommand.DeleteEntity(state, entity));
}

export default CursorBehavior;
