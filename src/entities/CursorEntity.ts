import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key, KeyCombo } from "../Input";
import {
  AddedTag,
  BehaviorComponent,
  InputReceiverTag,
  SpriteComponent2
} from "../components";
import { IMAGES, KEY_MAPS } from "../constants";
import {
  BehaviorCacheState,
  CameraState,
  EntityManagerState,
  InputState,
  TilesState
} from "../state";
import { Action, ActionDriver } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import {
  ControlCameraAction,
  CreateEntityAction,
  MoveAction,
  RemoveTagAction,
  SetAnimationClipIndexAction
} from "../actions";
import { Animation, AnimationClip, KeyframeTrack } from "../Animation";
import { invariant } from "../Error";
import { convertToTiles } from "../units/convert";

enum CursorMode {
  NORMAL,
  REPLACE
}

type Context = InputState & CameraState & TilesState;

class CursorBehavior extends Behavior<
  ReturnType<typeof CursorEntity.create>,
  Context
> {
  #mode = CursorMode.NORMAL;
  mapInput(
    entity: ReadonlyRecursive<ReturnType<typeof CursorEntity.create>>,
    state: ReadonlyRecursive<Context, KeyCombo>
  ): void | Action<ReturnType<typeof CursorEntity.create>, any>[] {
    if (state.cameraController !== (entity as any)) {
      return [new ControlCameraAction()];
    }

    if (entity.actions.size > 0) {
      return;
    }
    // TODO use state.inputs instead (and stop clearing it in action system)
    const { inputPressed } = state;

    const { position } = entity;

    switch (this.#mode) {
      case CursorMode.NORMAL:
        switch (inputPressed) {
          case Key.r:
            this.#mode = CursorMode.REPLACE;
            return [new SetAnimationClipIndexAction(1)];
          case Key.x: {
            const entsUnderCursor = state.tiles.get(
              convertToTiles(position.x),
              convertToTiles(position.y)
            );
            if (entsUnderCursor !== undefined) {
              return [new RemoveTagAction(AddedTag, entsUnderCursor)];
            }
            break;
          }
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
              return [
                new SetAnimationClipIndexAction(0),
                new CreateEntityAction(prefab, entity.position)
              ];
            }
        }
    }
  }
  chain(
    actions: ReadonlyArray<
      ActionDriver<ReturnType<typeof CursorEntity.create>, any>
    >
  ) {
    void actions;
  }
}

export const CursorEntity: IEntityPrefab<
  BehaviorCacheState & EntityManagerState,
  EntityWithComponents<typeof BehaviorComponent | typeof SpriteComponent2>
> = {
  create(state) {
    const entity = state.addEntity();

    invariant(
      globalThis.document !== undefined,
      `Editor cursor should only be created on the client`
    );

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/cursor"
    });

    if (!state.hasBehavior(entity.behaviorId)) {
      state.addBehavior(entity.behaviorId, new CursorBehavior());
    }

    const animation = new Animation([
      new AnimationClip("normal", 0, [
        new KeyframeTrack("default", new Float32Array(1), [
          IMAGES.editorNormalCursor
        ])
      ]),
      new AnimationClip("replace", 0, [
        new KeyframeTrack("default", new Float32Array(1), [
          IMAGES.editorReplaceCursor
        ])
      ])
    ]);

    SpriteComponent2.add(entity, {
      animation
    });

    // Make the cursor always render on top
    entity.sprite.material.depthTest = false;
    entity.sprite.renderOrder = 1;

    InputReceiverTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    BehaviorComponent.remove(entity);
    SpriteComponent2.remove(entity);
    InputReceiverTag.remove(entity);
    return entity;
  }
};
