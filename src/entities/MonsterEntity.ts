import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { HeadingDirection } from "../HeadingDirection";
import { MoveAction, PushAction, RotateAction } from "../actions";
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
  LogState
} from "../state";
import { Action, ActionEntity } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { Log } from "../systems/LogSystem";

type BehaviorContext = CameraState & InputState & LogState;

export class MonsterBehavior extends Behavior<
  ActionEntity<typeof TransformComponent>,
  BehaviorContext
> {
  static id = "behavior/monster";
  #log = new Log("Monster");
  onEnter(
    _entity: ActionEntity<typeof TransformComponent>,
    state: BehaviorContext
  ) {
    state.logs.addLog(this.#log);
  }
  onUpdate(entity: ReturnType<typeof MonsterEntity.create>) {
    let cancelledMove = false;
    for (const action of entity.cancelledActions) {
      cancelledMove ||= action instanceof MoveAction;
    }
    if (cancelledMove) {
      const newDirection = HeadingDirection.rotateCCW(entity.headingDirection);
      const turn = new RotateAction(entity, newDirection);
      turn.canUndo = false;
      this.#log.writeLn("Turned to face", entity.headingDirection);
      entity.cancelledActions.clear();
      return [turn];
    }

    if (entity.actions.size > 0) {
      return;
    }

    const move = new MoveAction(entity, entity.headingDirection);
    const push = new PushAction(entity, move.delta);
    push.causes.add(move);
    move.canUndo = false;
    push.canUndo = false;
    return [move, push];
  }
  onReceive(
    actions: ReadonlyArray<Action<ReturnType<typeof MonsterEntity.create>, any>>
  ) {
    void actions;
  }
}

type Context = EntityManagerState & BehaviorCacheState;
export const MonsterEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
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
