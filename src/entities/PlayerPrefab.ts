import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key, KeyCombo } from "../Input";
import { ControlCameraAction, MoveAction, PushAction } from "../actions";
import {
  AddedTag,
  BehaviorComponent,
  IsGameEntityTag,
  ModelComponent,
  TransformComponent
} from "../components";
import { ASSETS, KEY_MAPS } from "../constants";
import {
  BehaviorCacheState,
  CameraState,
  EntityManagerState,
  InputState
} from "../state";
import { Action, ActionEntity } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";

type BehaviorContext = CameraState & InputState;

export class PlayerBehavior extends Behavior<
  ActionEntity<typeof TransformComponent>,
  BehaviorContext
> {
  static id = "behavior/player";
  onEnter(entity: ActionEntity<typeof TransformComponent>) {
    return [new ControlCameraAction(entity)];
  }
  onUpdate(
    entity: ActionEntity<typeof TransformComponent>,
    state: ReadonlyRecursive<BehaviorContext, KeyCombo>
  ) {
    if (entity.actions.size > 0) {
      return;
    }
    const { inputPressed } = state;

    if (inputPressed in KEY_MAPS.MOVE) {
      const direction = KEY_MAPS.MOVE[inputPressed as Key];
      const move = new MoveAction(entity, direction, true);
      const push = new PushAction(entity, move.delta);
      push.causes.add(move);
      return [move, push];
    }
  }
  onReceive(
    actions: ReadonlyArray<Action<ReturnType<typeof PlayerEntity.create>, any>>
  ) {
    void actions;
  }
}

type Context = EntityManagerState & BehaviorCacheState;
export const PlayerEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    typeof BehaviorComponent | typeof TransformComponent | typeof ModelComponent
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

    IsGameEntityTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    TransformComponent.remove(entity);
    ModelComponent.remove(entity);
    BehaviorComponent.remove(entity);
    IsGameEntityTag.remove(entity);
    return entity;
  }
};
