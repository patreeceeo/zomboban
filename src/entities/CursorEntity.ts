import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key, KeyCombo } from "../Input";
import {
  BehaviorComponent,
  InputReceiverTag,
  SpriteComponent2
} from "../components";
import { IMAGES, KEY_MAPS } from "../constants";
import { State } from "../state";
import { Action, ActionDriver } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import {
  CreateEntityAction,
  MoveAction,
  SetAnimationClipIndexAction
} from "../actions";

enum CursorMode {
  NORMAL,
  REPLACE
}

class CursorBehavior extends Behavior<
  ReturnType<typeof CursorEntity.create>,
  State
> {
  #mode = CursorMode.NORMAL;
  mapInput(
    entity: ReadonlyRecursive<ReturnType<typeof CursorEntity.create>>,
    state: ReadonlyRecursive<State, KeyCombo>
  ): void | Action<ReturnType<typeof CursorEntity.create>, State>[] {
    if (entity.actions.size > 0) {
      return;
    }
    const { inputPressed } = state;

    switch (this.#mode) {
      case CursorMode.NORMAL:
        switch (inputPressed) {
          case Key.r:
            this.#mode = CursorMode.REPLACE;
            return [new SetAnimationClipIndexAction(1)];
          default:
            if (inputPressed in KEY_MAPS.MOVE) {
              return [new MoveAction(...KEY_MAPS.MOVE[inputPressed as Key])];
            }
        }
        break;
      case CursorMode.REPLACE:
        switch (inputPressed) {
          case Key.Escape:
            this.#mode = CursorMode.NORMAL;
            return [new SetAnimationClipIndexAction(0)];
          default:
            if (inputPressed in KEY_MAPS.CREATE_PREFEB) {
              const prefab = KEY_MAPS.CREATE_PREFEB[inputPressed as Key];
              this.#mode = CursorMode.NORMAL;
              return [new CreateEntityAction(prefab, entity.position)];
            }
        }
    }
  }
  react(
    actions: ReadonlyArray<
      ActionDriver<ReturnType<typeof CursorEntity.create>, State>
    >
  ) {
    void actions;
  }
}

export const CursorEntity: IEntityPrefab<
  State,
  EntityWithComponents<typeof BehaviorComponent | typeof SpriteComponent2>
> = {
  create(state) {
    const entity = {};

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/cursor"
    });

    if (!state.hasBehavior(entity.behaviorId)) {
      state.addBehavior(entity.behaviorId, new CursorBehavior());
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
                values: [IMAGES.editorNormalCursor],
                times: new Float32Array(1)
              }
            ]
          },
          {
            name: "default",
            duration: 0,
            tracks: [
              {
                name: "default",
                type: "string",
                values: [IMAGES.editorReplaceCursor],
                times: new Float32Array(1)
              }
            ]
          }
        ]
      }
    });

    InputReceiverTag.add(entity);

    return entity;
  },
  destroy(entity) {
    BehaviorComponent.remove(entity);
    SpriteComponent2.remove(entity);
    InputReceiverTag.remove(entity);
    return entity;
  }
};
