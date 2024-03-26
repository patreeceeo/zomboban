import { Animation, AnimationClip, KeyframeTrack } from "../Animation";
import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key, KeyCombo } from "../Input";
import { ControlCameraAction, MoveAction, PushAction } from "../actions";
import {
  BehaviorComponent,
  InputReceiverTag,
  IsGameEntityTag,
  SpriteComponent2,
  createObservableEntity
} from "../components";
import { IMAGES, KEY_MAPS } from "../constants";
import {
  BehaviorCacheState,
  CameraState,
  EntityManagerState,
  InputState,
  TimeState
} from "../state";
import { Action, ActionDriver } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";

type BehaviorContext = CameraState & InputState;

export class PlayerBehavior extends Behavior<
  ReturnType<typeof PlayerEntity.create>,
  BehaviorContext
> {
  static id = "behavior/player";
  mapInput(
    entity: ReadonlyRecursive<ReturnType<typeof PlayerEntity.create>>,
    state: ReadonlyRecursive<BehaviorContext, KeyCombo>
  ):
    | void
    | Action<
        ReturnType<typeof PlayerEntity.create>,
        CameraState | InputState | TimeState
      >[] {
    if (entity.actions.size > 0) {
      return;
    }
    const { inputPressed } = state;

    if (state.cameraController !== (entity as any)) {
      return [new ControlCameraAction()];
    }

    if (inputPressed in KEY_MAPS.MOVE) {
      const direction = KEY_MAPS.MOVE[inputPressed as Key];
      return [new MoveAction(...direction), new PushAction(...direction)];
    }
  }
  chain(
    actions: ReadonlyArray<
      ActionDriver<ReturnType<typeof PlayerEntity.create>, any>
    >
  ) {
    void actions;
  }
}

type Context = EntityManagerState & BehaviorCacheState;
export const PlayerEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    typeof BehaviorComponent | typeof SpriteComponent2 | typeof InputReceiverTag
  >
> = {
  create(state) {
    const entity = state.addEntity(createObservableEntity);

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/player"
    });

    const animation = new Animation([
      new AnimationClip("down", 0, [
        new KeyframeTrack("default", new Float32Array(1), [IMAGES.playerDown])
      ])
    ]);

    SpriteComponent2.add(entity, {
      animation
    });

    InputReceiverTag.add(entity);

    IsGameEntityTag.add(entity);

    return entity;
  },
  destroy(entity) {
    SpriteComponent2.remove(entity);
    BehaviorComponent.remove(entity);
    InputReceiverTag.remove(entity);
    IsGameEntityTag.remove(entity);
    return entity;
  }
};
