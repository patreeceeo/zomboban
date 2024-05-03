import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { MoveAction, PushAction } from "../actions";
import {
  AddedTag,
  BehaviorComponent,
  HeadingDirectionComponent,
  IsGameEntityTag,
  ModelComponent,
  TransformComponent
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
import { Action, ActionDriver } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { Log } from "../systems/LogSystem";

type BehaviorContext = CameraState & InputState & LogState;

export class MonsterBehavior extends Behavior<
  ReturnType<typeof MonsterEntity.create>,
  BehaviorContext
> {
  static id = "behavior/monster";
  #log = new Log("Monster");
  onEnter(
    _entity: ReadonlyRecursive<ReturnType<typeof MonsterEntity.create>>,
    state: BehaviorContext
  ) {
    state.logs.addLog(this.#log);
  }
  onUpdate(
    entity: ReadonlyRecursive<ReturnType<typeof MonsterEntity.create>>
  ):
    | void
    | Action<
        ReturnType<typeof MonsterEntity.create>,
        CameraState | InputState | TimeState
      >[] {
    if (entity.actions.size > 0) {
      return;
    }

    const { headingDirection } = entity;
    const move = new MoveAction(headingDirection, true);
    const push = new PushAction(headingDirection);
    move.chain(push);
    return [move, push];
  }
  onReceive(
    actions: ReadonlyArray<
      ActionDriver<ReturnType<typeof MonsterEntity.create>, any>
    >
  ) {
    void actions;
  }
  onCancel(
    action: Action<ReturnType<typeof MonsterEntity.create>, any>,
    entity: ReturnType<typeof MonsterEntity.create>
  ) {
    if (action instanceof MoveAction) {
      entity.headingDirection = (entity.headingDirection + 1) % 4;
      this.#log.writeLn("Turned to face", entity.headingDirection);
    }
  }
}

type Context = EntityManagerState & BehaviorCacheState;
export const MonsterEntity: IEntityPrefab<
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
      behaviorId: MonsterBehavior.id
    });

    TransformComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSETS.monster
    });

    HeadingDirectionComponent.add(entity);

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
