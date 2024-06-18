import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key } from "../Input";
import {
  ControlCameraAction,
  KillPlayerAction,
  MoveAction,
  PlayerWinAction,
  PushAction,
  RotateAction
} from "../actions";
import {
  AddedTag,
  BehaviorComponent,
  HeadingDirectionComponent,
  IsGameEntityTag,
  ModelComponent,
  TransformComponent,
  VelocityComponent
} from "../components";
import { ASSETS, KEY_MAPS } from "../constants";
import {
  BehaviorCacheState,
  CameraState,
  EntityManagerState,
  MetaState,
  MetaStatus,
  InputState,
  TimeState
} from "../state";
import { Action, ActionEntity } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";

type BehaviorContext = CameraState & InputState & MetaState & TimeState;

export class PlayerBehavior extends Behavior<
  ActionEntity<typeof TransformComponent | typeof HeadingDirectionComponent>,
  BehaviorContext
> {
  static id = "behavior/player";
  onEnter(
    entity: ActionEntity<typeof TransformComponent>,
    context: BehaviorContext
  ) {
    return [new ControlCameraAction(entity, context.time)];
  }
  onUpdate(
    entity: ReturnType<(typeof PlayerEntity)["create"]>,
    context: BehaviorContext
  ) {
    if (entity.actions.size > 0) {
      return;
    }
    const { inputPressed, time } = context;

    if (inputPressed in KEY_MAPS.MOVE) {
      const direction = KEY_MAPS.MOVE[inputPressed as Key];
      const move = new MoveAction(entity, time, direction);
      const push = new PushAction(entity, time, move.delta);
      push.causes.add(move);
      const actions = [move, push] as Action<any, any>[];
      if (direction !== entity.headingDirection) {
        const turn = new RotateAction(entity, time, direction);
        actions.push(turn);
      }
      return actions;
    }
  }
  onReceive(
    actions: ReadonlyArray<Action<ReturnType<typeof PlayerEntity.create>, any>>,
    _entity: ActionEntity<
      typeof TransformComponent | typeof HeadingDirectionComponent
    >,
    state: BehaviorContext
  ) {
    for (const action of actions) {
      if (action instanceof KillPlayerAction) {
        state.metaStatus = MetaStatus.Restart;
      }
      if (action instanceof PlayerWinAction) {
        state.metaStatus = MetaStatus.Win;
      }
    }

    const pushes = [];
    for (const action of actions) {
      if (action instanceof PushAction) {
        pushes.push(action);
      }
    }
    for (const action of pushes) {
      action.cancelled = true;
    }
  }
}

type Context = EntityManagerState & BehaviorCacheState;
export const PlayerEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof VelocityComponent
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

    VelocityComponent.add(entity);

    HeadingDirectionComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSETS.player
    });

    IsGameEntityTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};
