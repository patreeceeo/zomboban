import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { AddedTag, BehaviorComponent, IsActiveTag } from "../components";
import { KEY_MAPS } from "../constants";
import {
  ActionsState,
  BehaviorCacheState,
  EntityManagerState,
  GameState,
  MetaStatus,
  InputState,
  RouterState,
  TimeState
} from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { routeTo } from "../systems/RouterSystem";

type BehaviorContext = InputState &
  RouterState &
  ActionsState &
  GameState &
  TimeState;

class MyBehavior extends Behavior<
  ReturnType<typeof GlobalInputEntity.create>,
  BehaviorContext
> {
  onUpdate(
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
            const isPlayerActing = !!state.pendingActions.findLast(
              (a) => a.entity.behaviorId === "behavior/player"
            );
            if (!isPlayerActing) {
              const action = state.completedActions.findLast(
                (a) => a.entity.behaviorId === "behavior/player"
              );
              if (action) {
                state.undoInProgress = true;
                state.undoUntilTime = action.startTime - 1;
              }
            }
          }
          break;
        case KEY_MAPS.RESTART: {
          state.metaStatus = MetaStatus.Restart;
        }
      }
    }
  }
  onReceive() {}
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

    IsActiveTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    BehaviorComponent.remove(entity);
    return entity;
  }
};
