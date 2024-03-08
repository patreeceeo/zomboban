import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key, isKeyRepeating } from "../Input";
import { InputQueueComponent, SpriteComponent2 } from "../components";
import { IMAGES, KEY_MAPS, SPRITE_WIDTH } from "../constants";
import { State } from "../state";
import { Action } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { throttle } from "../util";

function moveCursorByTiles(
  entity: EntityWithComponents<typeof SpriteComponent2>,
  dx: number,
  dy: number
) {
  const { x, y, z } = entity.position;
  entity.position.set(x + dx * SPRITE_WIDTH, y + dy * SPRITE_WIDTH, z);
}

const slowThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 350);
const fastThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 50);

class CursorBehavior extends Behavior<
  ReturnType<typeof CursorEntity.create>,
  State
> {
  act(entity: ReturnType<typeof CursorEntity.create>, context: State) {
    void context;
    const inputMaybe = entity.inputs.shift();
    if (inputMaybe === undefined) {
      slowThrottledMoveCursorByTiles.cancel();
    } else {
      const input = inputMaybe!;

      if (input in KEY_MAPS.MOVE) {
        const throttledMoveCursorByTiles = isKeyRepeating(input)
          ? fastThrottledMoveCursorByTiles
          : slowThrottledMoveCursorByTiles;
        const [dx, dy] = KEY_MAPS.MOVE[input as Key];
        throttledMoveCursorByTiles(entity, dx as TilesX, dy);
      } else if (input === Key.r) {
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
  EntityWithComponents<typeof SpriteComponent2 | typeof InputQueueComponent>
> = {
  create(state) {
    const entity = {};

    SpriteComponent2.add(entity, {
      behaviorId: "behavior/cursor",
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
          }
        ]
      }
    });

    if (!state.hasBehavior(entity.behaviorId)) {
      state.addBehavior(entity.behaviorId, new CursorBehavior());
    }

    InputQueueComponent.add(entity);

    return entity;
  },
  destroy(entity) {
    SpriteComponent2.remove(entity);
    InputQueueComponent.remove(entity);
    return entity;
  }
};
