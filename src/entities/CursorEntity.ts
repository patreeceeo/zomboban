import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key } from "../Input";
import {
  AddedTag,
  AnimationComponent,
  BehaviorComponent,
  RenderOptionsComponent,
  TransformComponent
} from "../components";
import { ASSETS, KEY_MAPS } from "../constants";
import {
  BehaviorState,
  CameraState,
  EntityManagerState,
  InputState,
  MetaState,
  MetaStatus,
  TimeState
} from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import {
  ControlCameraAction,
  CreateEntityAction,
  MoveAction,
  RemoveEntitiesAction,
  SetAnimationClipAction
} from "../actions";
import { invariant } from "../Error";
import { convertToTiles } from "../units/convert";
import {
  AnimationClipJson,
  AnimationJson,
  KeyframeTrackJson
} from "../Animation";
import { HeadingDirection } from "../HeadingDirection";
import { ITilesState } from "../systems/TileSystem";

type Entity = ReturnType<typeof CursorEntity.create>;
type Context = InputState &
  CameraState &
  ITilesState &
  TimeState &
  MetaState &
  EntityManagerState;

export class CursorBehavior extends Behavior<Entity, Context> {
  id = "behavior/cursor";
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
              const prefab = KEY_MAPS.CREATE_PREFEB[inputPressed as Key];
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

export const CursorEntity: IEntityPrefab<
  BehaviorState & EntityManagerState,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof AnimationComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    invariant(
      globalThis.document !== undefined,
      `Editor cursor should only be created on the client`
    );

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/cursor"
    });

    if (!state.hasBehavior(entity.behaviorId)) {
      state.addBehavior(entity.behaviorId, new CursorBehavior());
    }

    const animation = new AnimationJson([
      new AnimationClipJson("normal", 0, [
        new KeyframeTrackJson(
          "default",
          "string",
          [0],
          [ASSETS.editorNormalCursor]
        )
      ]),
      new AnimationClipJson("replace", 0, [
        new KeyframeTrackJson(
          "default",
          "string",
          [0],
          [ASSETS.editorReplaceCursor]
        )
      ])
    ]);

    AnimationComponent.add(entity, {
      animation
    });

    TransformComponent.add(entity);

    RenderOptionsComponent.add(entity, {
      renderOrder: 1,
      depthTest: false
    });

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};
