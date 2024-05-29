import { EntityManagerState, TimeState } from "../state";
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

type BehaviorContext = TimeState;

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
    entity: ReturnType<typeof RoosterEntity.create>,
    context: BehaviorContext
  ) {
    for (const action of actions) {
      if (action instanceof PushAction) {
        const win = new PlayerWinAction(entity, context.time);
        const { position } = entity.transform;
        win.addEffectedTile(
          position.x - action.delta.x,
          position.y - action.delta.y
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
