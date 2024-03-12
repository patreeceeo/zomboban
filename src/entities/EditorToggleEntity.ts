import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key } from "../Input";
import {
  BehaviorComponent,
  InputReceiverTag,
  IsActiveTag
} from "../components";
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

class EditorToggleBehavior extends Behavior<
  ReturnType<typeof EditorToggleEntity.create>,
  BehaviorContext
> {
  mapInput(
    entity: ReturnType<typeof EditorToggleEntity.create>,
    state: BehaviorContext
  ) {
    void entity;
    const { inputs } = state;
    if (inputs.length > 0) {
      const input = inputs.shift()!;

      if (input === Key.Space) {
        if (state.currentRoute === "game") {
          routeTo("editor");
        } else {
          routeTo("game");
        }
      }
    }
  }
  react() {}
}

type Context = EntityManagerState & BehaviorCacheState;
export const EditorToggleEntity: IEntityPrefab<
  Context,
  EntityWithComponents<typeof BehaviorComponent>
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/editorToggle"
    });

    if (!state.hasBehavior(entity.behaviorId)) {
      state.addBehavior(entity.behaviorId, new EditorToggleBehavior());
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
