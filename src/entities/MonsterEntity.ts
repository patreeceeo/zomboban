import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { HeadingDirection } from "../HeadingDirection";
import {
  KillPlayerAction,
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
  TransformComponent,
  VelocityComponent
} from "../components";
import { ASSETS } from "../constants";
import {
  BehaviorCacheState,
  CameraState,
  EntityManagerState,
  InputState,
  LogState,
  TimeState
} from "../state";
import { Action, ActionEntity } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { Log } from "../systems/LogSystem";

type BehaviorContext = CameraState & InputState & LogState & TimeState;

export class MonsterBehavior extends Behavior<
  ActionEntity<typeof TransformComponent>,
  BehaviorContext
> {
  static id = "behavior/monster";
  #log = new Log("Monster");
  onEnter(
    _entity: ReturnType<typeof MonsterEntity.create>,
    context: BehaviorContext
  ) {
    context.logs.addLog(this.#log);
  }
  onUpdate(
    entity: ReturnType<typeof MonsterEntity.create>,
    context: BehaviorContext
  ) {
    let cancelledMove = false;
    const { time } = context;
    for (const action of entity.cancelledActions) {
      cancelledMove ||= action instanceof MoveAction;
    }
    if (cancelledMove) {
      const newDirection = HeadingDirection.rotateCCW(entity.headingDirection);
      const turn = new RotateAction(entity, time, newDirection);
      this.#log.writeLn("Turned to face", entity.headingDirection);
      entity.cancelledActions.clear();
      return [turn];
    }

    if (entity.actions.size > 0) {
      return;
    }

    const { position } = entity.transform;
    const move = new MoveAction(entity, time, entity.headingDirection);
    const push = new PushAction(entity, time, move.delta);
    const kill = new KillPlayerAction(entity, time);
    kill
      .addEffectedTile(position.x, position.y)
      .addEffectedTile(position.x + move.delta.x, position.y + move.delta.y);
    push.causes.add(move);
    return [move, push, kill];
  }
  onReceive(
    actions: ReadonlyArray<Action<ReturnType<typeof MonsterEntity.create>, any>>
  ) {
    // TODO behavior composition
    for (const action of actions) {
      if (action instanceof PushAction) {
        action.cancelled = true;
      }
    }
  }
}

type Context = EntityManagerState & BehaviorCacheState;
export const MonsterEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof HeadingDirectionComponent
    | typeof VelocityComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: MonsterBehavior.id
    });

    TransformComponent.add(entity);

    VelocityComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSETS.monster
    });

    HeadingDirectionComponent.add(entity);

    IsGameEntityTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};
