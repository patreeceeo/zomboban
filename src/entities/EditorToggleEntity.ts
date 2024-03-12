import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key } from "../Input";
import {
  BehaviorComponent,
  InputReceiverTag,
  IsActiveTag
} from "../components";
import { State } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { routeTo } from "../systems/RouterSystem";

class EditorToggleBehavior extends Behavior<
  ReturnType<typeof EditorToggleEntity.create>,
  State
> {
  mapInput(entity: ReturnType<typeof EditorToggleEntity.create>, state: State) {
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

export const EditorToggleEntity: IEntityPrefab<
  State,
  EntityWithComponents<typeof BehaviorComponent>
> = {
  create(state) {
    const entity = {};

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
