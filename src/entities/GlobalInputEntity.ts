import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import {
  BehaviorComponent,
  InputReceiverTag,
  IsActiveTag
} from "../components";
import { KEY_MAPS } from "../constants";
import {
  ActionsState,
  BehaviorCacheState,
  EntityManagerState,
  InputState,
  RouterState
} from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { routeTo } from "../systems/RouterSystem";

type BehaviorContext = InputState & RouterState & ActionsState;

class MyBehavior extends Behavior<
  ReturnType<typeof GlobalInputEntity.create>,
  BehaviorContext
> {
  mapInput(
    entity: ReturnType<typeof GlobalInputEntity.create>,
    state: BehaviorContext
  ) {
    void entity;
    const { inputs } = state;
    if (inputs.length > 0) {
      const input = inputs.shift()!;

      switch (input) {
        case KEY_MAPS.TOGGLE_EDITOR:
          {
            if (state.currentRoute === "game") {
              routeTo("editor");
            } else {
              routeTo("game");
            }
          }
          break;
        case KEY_MAPS.UNDO:
          {
            state.undo = true;
          }
          break;
      }
    }
  }
  chain() {}
}

type Context = EntityManagerState & BehaviorCacheState;
export const GlobalInputEntity: IEntityPrefab<
  Context,
  EntityWithComponents<typeof BehaviorComponent>
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/globalInput"
    });

    if (!state.hasBehavior(entity.behaviorId)) {
      state.addBehavior(entity.behaviorId, new MyBehavior());
    }

    InputReceiverTag.add(entity);

    IsActiveTag.add(entity);

    return entity;
  },
  destroy(entity) {
    BehaviorComponent.remove(entity);
    InputReceiverTag.remove(entity);
    return entity;
  }
};
