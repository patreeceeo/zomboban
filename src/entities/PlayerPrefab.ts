import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { InputQueueComponent, SpriteComponent2 } from "../components";
import { IMAGES } from "../constants";
import { State } from "../state";
import { Action } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";

class PlayerBehavior extends Behavior<
  ReturnType<typeof PlayerEntity.create>,
  State
> {
  act(
    entity: ReturnType<typeof PlayerEntity.create>,
    context: State
  ): Action<ReturnType<typeof PlayerEntity.create>, State>[] {
    void context;
    void entity;
    return [];
  }
  react(
    actions: Action<ReturnType<typeof PlayerEntity.create>, State>[],
    entity: ReturnType<typeof PlayerEntity.create>,
    context: State
  ): Action<ReturnType<typeof PlayerEntity.create>, State>[] {
    void context;
    void entity;
    return actions;
  }
}

export const PlayerEntity: IEntityPrefab<
  State,
  EntityWithComponents<typeof SpriteComponent2 | typeof InputQueueComponent>
> = {
  create(state) {
    const entity = {};

    SpriteComponent2.add(entity, {
      behaviorId: "behavior/player",
      animation: {
        playing: false,
        clipIndex: 0,
        clips: [
          {
            name: "default",
            duration: 0,
            tracks: [
              {
                name: "default",
                type: "string",
                values: [IMAGES.playerDown],
                times: new Float32Array(1)
              }
            ]
          }
        ]
      }
    });

    InputQueueComponent.add(entity);

    if (!state.hasBehavior(entity.behaviorId)) {
      state.addBehavior(entity.behaviorId, new PlayerBehavior());
    }

    return entity;
  },
  destroy(entity) {
    SpriteComponent2.remove(entity);
    InputQueueComponent.remove(entity);
    return entity;
  }
};
