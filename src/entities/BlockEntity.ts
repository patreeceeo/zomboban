import { Vector2 } from "three";
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
import { Action } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { HeadingDirectionValue } from "../HeadingDirection";

/** find the net effect of multiple move actions */
function findNetDelta(deltas: Vector2[], target = new Vector2()) {
  for (const delta of deltas) {
    target.x += delta.x;
    target.y += delta.y;
  }
  return target;
}

export class BlockBehavior extends Behavior<any, any> {
  static id = "behavior/block";
  onUpdate(): void {}
  onReceive(
    actions: ReadonlyArray<Action<any, any>>,
    entity: ReturnType<typeof BlockEntity.create>
  ) {
    const returnedActions: Action<
      ReturnType<typeof BlockEntity.create>,
      any
    >[] = [];
    const nonBlockActions = [];
    for (const action of actions) {
      if (action instanceof PushAction) {
        if (action.entity.behaviorId !== "behavior/block") {
          nonBlockActions.push(action);
        }
      }
    }
    if (nonBlockActions.length > 0) {
      const move = new MoveAction(entity, HeadingDirectionValue.None, false);

      for (const action of nonBlockActions) {
        move.causes.add(action);
      }

      findNetDelta(
        nonBlockActions.map((action) => action.delta),
        move.delta
      );

      const push = new PushAction(entity, move.delta);

      push.causes.add(move);

      returnedActions.push(move, push);
    } else {
      for (const action of actions) {
        action.cancelled = true;
      }
    }

    return returnedActions;
  }
}

type Context = EntityManagerState & BehaviorCacheState;
export const BlockEntity: IEntityPrefab<
  Context,
  EntityWithComponents<typeof BehaviorComponent | typeof TransformComponent>
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
