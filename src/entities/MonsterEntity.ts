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
    if (entity.actions.size > 0) {
      return;
    }

    const move = new MoveAction(entity, entity.headingDirection);
    // TODO: maybe should return a rotate action from onCancel instead?
    const turn = new RotateAction(entity, entity.headingDirection);
    const push = new PushAction(entity, move.delta);
    push.causes.add(move);
    move.canUndo = false;
    turn.canUndo = false;
    push.canUndo = false;
    return [move, turn, push];
  }
  onReceive(
    actions: ReadonlyArray<Action<ReturnType<typeof MonsterEntity.create>, any>>
  ) {
    void actions;
  }
  onCancel(
    action: Action<ReturnType<typeof MonsterEntity.create>, any>,
    entity: ReturnType<typeof MonsterEntity.create>
  ) {
    if (action instanceof MoveAction) {
      entity.headingDirection = HeadingDirection.rotateCCW(
        entity.headingDirection
      );
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
