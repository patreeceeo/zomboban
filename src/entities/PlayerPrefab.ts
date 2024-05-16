import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key, KeyCombo } from "../Input";
import {
  ControlCameraAction,
  MoveAction,
  PushAction,
  RotateAction
} from "../actions";
import {
  AddedTag,
  BehaviorComponent,
  HeadingDirectionComponent,
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
  ActionEntity<typeof TransformComponent | typeof HeadingDirectionComponent>,
  BehaviorContext
> {
  static id = "behavior/player";
  onEnter(entity: ActionEntity<typeof TransformComponent>) {
    return [new ControlCameraAction(entity)];
  }
  onUpdate(
    entity: ActionEntity<
      typeof TransformComponent | typeof HeadingDirectionComponent
    >,
    state: ReadonlyRecursive<BehaviorContext, KeyCombo>
  ) {
    if (entity.actions.size > 0) {
      return;
    }
    const { inputPressed } = state;

    if (inputPressed in KEY_MAPS.MOVE) {
      const direction = KEY_MAPS.MOVE[inputPressed as Key];
      const move = new MoveAction(entity, direction);
      const push = new PushAction(entity, move.delta);
      push.causes.add(move);
      const actions = [move, push] as Action<any, any>[];
      if (direction !== entity.headingDirection) {
        const turn = new RotateAction(entity, direction);
        actions.push(turn);
      }
      return actions;
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
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof ModelComponent
    | typeof HeadingDirectionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/player"
    });

    TransformComponent.add(entity);

    HeadingDirectionComponent.add(entity);

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
