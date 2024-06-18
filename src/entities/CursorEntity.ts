import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key } from "../Input";
import {
  AddedTag,
  AnimationComponent,
  BehaviorComponent,
  RenderOptionsComponent,
  TransformComponent,
  VelocityComponent
} from "../components";
import { ASSETS, KEY_MAPS } from "../constants";
import {
  BehaviorCacheState,
  CameraState,
  EntityManagerState,
  InputState,
  MetaState,
  MetaStatus,
  TilesState,
  TimeState
} from "../state";
import { Action } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import {
  ControlCameraAction,
  CreateEntityAction,
  MoveAction,
  RemoveEntityAction,
  SetAnimationClipIndexAction
} from "../actions";
import { invariant } from "../Error";
import { convertToTiles } from "../units/convert";
import {
  AnimationClipJson,
  AnimationJson,
  KeyframeTrackJson
} from "../Animation";

type Context = InputState & CameraState & TilesState & TimeState & MetaState;

export class CursorBehavior extends Behavior<
  ReturnType<typeof CursorEntity.create>,
  Context
> {
  id = "behavior/cursor";
  onEnter(entity: ReturnType<typeof CursorEntity.create>, context: Context) {
    return [new ControlCameraAction(entity, context.time)];
  }
  onUpdate(entity: ReturnType<typeof CursorEntity.create>, context: Context) {
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
            return [new SetAnimationClipIndexAction(entity, time, 1)];
          case Key.x: {
            const entsUnderCursor = context.tiles.get(
              convertToTiles(position.x),
              convertToTiles(position.y)
            );
            if (entsUnderCursor !== undefined) {
              return [new RemoveEntityAction(entity, time, entsUnderCursor[0])];
            }
            break;
          }
          default:
            if (inputPressed in KEY_MAPS.MOVE) {
              const move = new MoveAction(
                entity,
                time,
                KEY_MAPS.MOVE[inputPressed as Key]
              );
              return [move];
            }
        }
        break;
      case MetaStatus.Replace:
        switch (inputPressed) {
          case Key.Escape:
            context.metaStatus = MetaStatus.Edit;
            return [new SetAnimationClipIndexAction(entity, time, 0)];
          default:
            if (inputPressed in KEY_MAPS.CREATE_PREFEB) {
              const prefab = KEY_MAPS.CREATE_PREFEB[inputPressed as Key];
              const tileX = convertToTiles(position.x);
              const tileY = convertToTiles(position.y);
              const nttsAreUnderCursor = context.tiles.has(tileX, tileY);
              const entsUnderCursor = context.tiles.get(tileX, tileY);
              context.metaStatus = MetaStatus.Edit;
              return [
                new SetAnimationClipIndexAction(entity, time, 0),
                ...(nttsAreUnderCursor
                  ? [new RemoveEntityAction(entity, time, entsUnderCursor[0])]
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
  onReceive(
    actions: ReadonlyArray<Action<ReturnType<typeof CursorEntity.create>, any>>
  ) {
    void actions;
  }
}

export const CursorEntity: IEntityPrefab<
  BehaviorCacheState & EntityManagerState,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof AnimationComponent
    | typeof VelocityComponent
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

    VelocityComponent.add(entity);

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
