import { Vector2 } from "three";
import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { KillPlayerAction, MoveAction, PushAction } from "../actions";
import {
  AddedTag,
  BehaviorComponent,
  IdComponent,
  IsGameEntityTag,
  ModelComponent,
  TransformComponent
} from "../components";
import { ASSETS } from "../constants";
import { BehaviorCacheState, EntityManagerState, TimeState } from "../state";
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
  onUpdate(entity: ReturnType<typeof BlockEntity.create>, context: TimeState) {
    let hasPush = false;
    for (const action of entity.actions) {
      hasPush = hasPush || action instanceof PushAction;
    }
    if (hasPush) {
      const { position } = entity.transform;
      const kill = new KillPlayerAction(entity, context.time);
      kill.addEffectedTile(position.x, position.y);
      return [kill];
    }
  }
  onReceive(
    actions: ReadonlyArray<Action<any, any>>,
    entity: ReturnType<typeof BlockEntity.create>,
    context: TimeState
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
      const move = new MoveAction(
        entity,
        context.time,
        HeadingDirectionValue.None
      );

      for (const action of nonBlockActions) {
        move.causes.add(action);
      }

      findNetDelta(
        nonBlockActions.map((action) => action.delta),
        move.delta
      );

      const push = new PushAction(entity, context.time, move.delta);

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
    return entity;
  }
};
