import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key } from "../Input";
import { BehaviorComponent, InputQueueComponent } from "../components";
import { State } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { routeTo } from "../systems/RouterSystem";

class EditorToggleBehavior extends Behavior<
  ReturnType<typeof EditorToggleEntity.create>,
  State
> {
  act(entity: ReturnType<typeof EditorToggleEntity.create>, context: State) {
    const { inputs } = entity;
    if (inputs.length > 0) {
      const input = inputs.shift()!;

      if (input === Key.Space) {
        if (context.currentRoute === "game") {
          routeTo("editor");
        } else {
          routeTo("game");
        }
      }
    }
    return [];
  }
  react() {
    return [];
  }
}

export const EditorToggleEntity: IEntityPrefab<
  State,
  EntityWithComponents<typeof InputQueueComponent>
> = {
  create(state) {
    const entity = {};

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/editorToggle"
    });

    if (!state.hasBehavior(entity.behaviorId)) {
      state.addBehavior(entity.behaviorId, new EditorToggleBehavior());
    }

    InputQueueComponent.add(entity);

    return entity;
  },
  destroy(entity) {
    BehaviorComponent.remove(entity);
    InputQueueComponent.remove(entity);
    return entity;
  }
};
