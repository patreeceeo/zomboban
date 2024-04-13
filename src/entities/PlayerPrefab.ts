import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key, KeyCombo } from "../Input";
import { ControlCameraAction, MoveAction, PushAction } from "../actions";
import {
  AddedTag,
  BehaviorComponent,
  InputReceiverTag,
  IsGameEntityTag,
  ModelComponent,
  TransformComponent
} from "../components";
import { ASSETS, KEY_MAPS } from "../constants";
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
  start() {
    return [new ControlCameraAction()];
  }
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

    if (inputPressed in KEY_MAPS.MOVE) {
      const direction = KEY_MAPS.MOVE[inputPressed as Key];
      const move = new MoveAction(...direction, true);
      const push = new PushAction(...direction);
      move.chain(push);
      return [move, push];
    }
  }
  understandsInput(
    _: any,
    state: ReadonlyRecursive<BehaviorContext, KeyCombo>
  ) {
    const { inputPressed } = state;
    const result = inputPressed in KEY_MAPS.MOVE;
    return result;
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
    | typeof BehaviorComponent
    | typeof InputReceiverTag
    | typeof TransformComponent
    | typeof ModelComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/player"
    });

    TransformComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSETS.player
    });

    InputReceiverTag.add(entity);

    IsGameEntityTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    TransformComponent.remove(entity);
    ModelComponent.remove(entity);
    BehaviorComponent.remove(entity);
    InputReceiverTag.remove(entity);
    IsGameEntityTag.remove(entity);
    return entity;
  }
};
