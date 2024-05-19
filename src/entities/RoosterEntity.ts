import { EntityManagerState } from "../state";
import { IEntityPrefab } from "../EntityManager";
import { EntityWithComponents } from "../Component";
import {
  AddedTag,
  BehaviorComponent,
  HeadingDirectionComponent,
  IsGameEntityTag,
  ModelComponent,
  TransformComponent
} from "../components";
import { ASSETS } from "../constants";
import { Action, ActionEntity } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { PlayerWinAction, PushAction } from "../actions";
import { Vector2 } from "three";

type BehaviorContext = never;

export class RoosterBehavior extends Behavior<
  ActionEntity<typeof TransformComponent>,
  BehaviorContext
> {
  static id = "behavior/rooster";
  onUpdate(_entity: ReturnType<typeof RoosterEntity.create>) {}
  onReceive(
    actions: ReadonlyArray<
      Action<ReturnType<typeof RoosterEntity.create>, any>
    >,
    entity: ReturnType<typeof RoosterEntity.create>
  ) {
    for (const action of actions) {
      if (action instanceof PushAction) {
        const win = new PlayerWinAction(entity);
        const { position } = entity.transform;
        win.effectedArea.push(
          new Vector2(position.x - action.delta.x, position.y - action.delta.y)
        );
        return [win];
      }
    }
  }
}

export const RoosterEntity: IEntityPrefab<
  EntityManagerState,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof HeadingDirectionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: RoosterBehavior.id
    });

    TransformComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSETS.rooster
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
