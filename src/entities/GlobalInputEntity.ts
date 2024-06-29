import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { MoveAction } from "../actions";
import { AddedTag, BehaviorComponent, IsActiveTag } from "../components";
import { KEY_MAPS } from "../constants";
import {
  ActionsState,
  BehaviorState,
  EntityManagerState,
  MetaState,
  MetaStatus,
  InputState,
  RouterState,
  TimeState
} from "../state";
import { UndoState } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { routeTo } from "../systems/RouterSystem";

type BehaviorContext = InputState &
  RouterState &
  ActionsState &
  MetaState &
  TimeState;

class MyBehavior extends Behavior<
  ReturnType<typeof GlobalInputEntity.create>,
  BehaviorContext
> {
  onUpdateEarly(
    entity: ReturnType<typeof GlobalInputEntity.create>,
    state: BehaviorContext
  ) {
    void entity;
    const { inputs } = state;
    if (inputs.length > 0) {
      const input = inputs[0];

      switch (input) {
        case KEY_MAPS.TOGGLE_MENU:
          {
            if (state.currentRoute === "game") {
              routeTo("pauseMenu");
            } else {
              routeTo("game");
            }
          }
          break;

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
            const action = state.completedActions.findLast(
              (a) =>
                a.entity.behaviorId === "behavior/player" &&
                a instanceof MoveAction
            );
            if (action) {
              state.undoState = UndoState.FinishPendingActions;
              state.undoActionId = action.id;
              // console.log(
              //   "REQUESTED UNDO action",
              //   action.toString(),
              //   "from",
              //   action.entity.behaviorId
              // );
            }
          }
          break;

        case KEY_MAPS.RESTART: {
          state.metaStatus = MetaStatus.Restart;
        }
      }
    }
  }
}

type Context = EntityManagerState & BehaviorState;
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
