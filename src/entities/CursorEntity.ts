import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key, isKeyRepeating } from "../Input";
import {
  BehaviorComponent,
  InputQueueComponent,
  SpriteComponent2
} from "../components";
import { IMAGES, KEY_MAPS } from "../constants";
import { State } from "../state";
import { Action } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { convertToPixels } from "../units/convert";
import { throttle } from "../util";

function moveCursorByTiles(
  entity: EntityWithComponents<typeof SpriteComponent2>,
  dx: Tile,
  dy: Tile
) {
  const { x, y, z } = entity.position;
  entity.position.set(x + convertToPixels(dx), y + convertToPixels(dy), z);
}

const slowThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 350);
const fastThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 50);

enum CursorMode {
  NORMAL,
  REPLACE
}

class CursorBehavior extends Behavior<
  ReturnType<typeof CursorEntity.create>,
  State
> {
  #mode = CursorMode.NORMAL;
  act(cursor: ReturnType<typeof CursorEntity.create>, context: State) {
    void context;
    const { inputs, animation, position } = cursor;
    if (inputs.length > 0) {
      const input = inputs.shift()!;

      switch (this.#mode) {
        case CursorMode.NORMAL:
          switch (input) {
            case Key.r:
              this.#mode = CursorMode.REPLACE;
              animation.clipIndex = 1;
              break;
            default:
              if (input in KEY_MAPS.MOVE) {
                const throttledMoveCursorByTiles = isKeyRepeating(input)
                  ? fastThrottledMoveCursorByTiles
                  : slowThrottledMoveCursorByTiles;
                const [dx, dy] = KEY_MAPS.MOVE[input as Key];
                throttledMoveCursorByTiles(cursor, dx, dy);
              }
          }
          break;
        case CursorMode.REPLACE:
          switch (input) {
            case Key.Escape:
              this.#mode = CursorMode.NORMAL;
              animation.clipIndex = 0;
              break;
            default:
              if (input in KEY_MAPS.CREATE_PREFEB) {
                const prefab = KEY_MAPS.CREATE_PREFEB[input as Key];
                const createdEntity = context.addEntity(prefab.create);
                createdEntity.position.copy(position);
                this.#mode = CursorMode.NORMAL;
              }
          }
      }
    }
    return [] as Action<ReturnType<typeof CursorEntity.create>, State>[];
  }
  react(
    actions: Action<ReturnType<typeof CursorEntity.create>, State>[],
    entity: ReturnType<typeof CursorEntity.create>,
    context: State
  ) {
    void actions;
    void entity;
    void context;
    return [] as Action<ReturnType<typeof CursorEntity.create>, State>[];
  }
}

export const CursorEntity: IEntityPrefab<
  State,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof SpriteComponent2
    | typeof InputQueueComponent
  >
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

    InputQueueComponent.add(entity);

    return entity;
  },
  destroy(entity) {
    BehaviorComponent.remove(entity);
    SpriteComponent2.remove(entity);
    InputQueueComponent.remove(entity);
    return entity;
  }
};
