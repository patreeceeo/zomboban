import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { PushAction } from "../actions";
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

export class WallBehavior extends Behavior<any, any> {
  static id = "behavior/wall";
  onReceive(actions: ReadonlyArray<Action<any, any>>) {
    const returnedActions: Action<ReturnType<typeof WallEntity.create>, any>[] =
      [];
    const pushes = [];

    for (const action of actions) {
      if (action instanceof PushAction) {
        pushes.push(action);
      }
    }
    for (const action of pushes) {
      action.cancelled = true;
    }

    return returnedActions;
  }
}

type Context = EntityManagerState & BehaviorCacheState;
export const WallEntity: IEntityPrefab<
  Context,
  EntityWithComponents<typeof BehaviorComponent | typeof TransformComponent>
> = {
  create(state) {
    const entity = state.addEntity();

    IdComponent.add(entity);

    BehaviorComponent.add(entity, {
      behaviorId: WallBehavior.id
    });

    ModelComponent.add(entity, {
      modelId: ASSETS.wall
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
