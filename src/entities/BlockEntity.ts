import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { MoveAction, PushAction } from "../actions";
import {
  AddedTag,
  BehaviorComponent,
  IdComponent,
  IsGameEntityTag,
  ModelComponent,
  TransformComponent
} from "../components";
import { ASSETS } from "../constants";
import { BehaviorCacheState, EntityManagerState } from "../state";
import { Action, ActionDriver } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";

/** find the net effect of multiple move actions */
function findNetActions(actions: ReadonlyArray<PushAction>) {
  const push = new PushAction(0);
  const move = new MoveAction(0);
  push.delta.set(0, 0);
  move.delta.set(0, 0);
  for (const action of actions) {
    move.delta.x += action.delta.x;
    move.delta.y += action.delta.y;
    push.delta.x += action.delta.x;
    push.delta.y += action.delta.y;
  }
  move.addDependency(push);
  return [move, push] as const;
}

export class BlockBehavior extends Behavior<any, any> {
  static id = "behavior/block";
  onUpdate(): void {}
  onReceive(
    actions: ReadonlyArray<ActionDriver<any, any>>,
    _entity: ReadonlyRecursive<ReturnType<typeof BlockEntity.create>>
  ) {
    const returnedActions: Action<
      ReturnType<typeof BlockEntity.create>,
      any
    >[] = [];
    const nonBlockActions = [];
    for (const action of actions) {
      if (action.action instanceof PushAction) {
        if (action.entity.behaviorId !== "behavior/block") {
          nonBlockActions.push(action.action);
        }
      }
    }
    if (nonBlockActions.length > 0) {
      const [move, push] = findNetActions(nonBlockActions);
      for (const cause of nonBlockActions) {
        cause.addDependency(move);
      }
      returnedActions.push(move, push);
    } else {
      const push = new PushAction(0);
      push.cancelled = true;
      for (const cause of actions) {
        cause.action.addDependency(push);
      }
      returnedActions.push(push);
    }

    return returnedActions;
  }
}

type Context = EntityManagerState & BehaviorCacheState;
export const BlockEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof ModelComponent
    | typeof IdComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    IdComponent.add(entity);

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/block"
    });

    ModelComponent.add(entity, {
      modelId: ASSETS.block
    });

    TransformComponent.add(entity);

    IsGameEntityTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    TransformComponent.remove(entity);
    ModelComponent.remove(entity);
    BehaviorComponent.remove(entity);
    AddedTag.remove(entity);
    IsGameEntityTag.remove(entity);
    return entity;
  }
};
