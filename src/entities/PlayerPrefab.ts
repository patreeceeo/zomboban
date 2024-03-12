import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key, KeyCombo } from "../Input";
import { ControlCameraAction, MoveAction } from "../actions";
import {
  BehaviorComponent,
  InputReceiverTag,
  IsGameEntityTag,
  SpriteComponent2
} from "../components";
import { IMAGES, KEY_MAPS } from "../constants";
import { State } from "../state";
import { Action, ActionDriver } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";

class PlayerBehavior extends Behavior<
  ReturnType<typeof PlayerEntity.create>,
  State
> {
  mapInput(
    entity: ReadonlyRecursive<ReturnType<typeof PlayerEntity.create>>,
    state: ReadonlyRecursive<State, KeyCombo>
  ): void | Action<ReturnType<typeof PlayerEntity.create>, State>[] {
    if (entity.actions.size > 0) {
      return;
    }
    const { inputPressed } = state;

    if (state.cameraController !== (entity as any)) {
      return [new ControlCameraAction()];
    }

    if (inputPressed in KEY_MAPS.MOVE) {
      return [new MoveAction(...KEY_MAPS.MOVE[inputPressed as Key])];
    }
  }
  react(
    actions: ReadonlyArray<
      ActionDriver<ReturnType<typeof PlayerEntity.create>, State>
    >
  ) {
    void actions;
  }
}

export const PlayerEntity: IEntityPrefab<
  State,
  EntityWithComponents<
    typeof BehaviorComponent | typeof SpriteComponent2 | typeof InputReceiverTag
  >
> = {
  create(state) {
    const entity = {};

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/player"
    });

    if (!state.hasBehavior(entity.behaviorId)) {
      state.addBehavior(entity.behaviorId, new PlayerBehavior());
    }

    SpriteComponent2.add(entity, {
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

    InputReceiverTag.add(entity);

    IsGameEntityTag.add(entity);

    return entity;
  },
  destroy(entity) {
    SpriteComponent2.remove(entity);
    BehaviorComponent.remove(entity);
    InputReceiverTag.remove(entity);
    return entity;
  }
};
