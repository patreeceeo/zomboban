import { Animation, AnimationClip, KeyframeTrack } from "../Animation";
import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { MoveAction } from "../actions";
import {
  BehaviorComponent,
  IdComponent,
  IsGameEntityTag,
  SpriteComponent2
} from "../components";
import { IMAGES } from "../constants";
import { BehaviorCacheState, EntityManagerState } from "../state";
import { ActionDriver } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";

/** find the net effect of multiple move actions */
function findNetMoveAction(actions: ReadonlyArray<MoveAction>) {
  const netAction = new MoveAction(0 as Tile, 0 as Tile);
  for (const action of actions) {
    netAction.delta.x += action.delta.x;
    netAction.delta.y += action.delta.y;
  }
  return netAction;
}

class MyBehavior extends Behavior<any, any> {
  mapInput(): void {}
  chain(
    actions: ReadonlyArray<ActionDriver<any, any>>,
    _entity: ReadonlyRecursive<ReturnType<typeof BlockEntity.create>>
  ) {
    const returnedActions: MoveAction[] = [];
    const nonBlockMoveActions = [];
    for (const action of actions) {
      if (action.action instanceof MoveAction) {
        // console.log(
        //   "block",
        //   entity.id,
        //   "reacting to action",
        //   action.action.id,
        //   "from",
        //   action.entity.id
        // );
        if (action.entity.behaviorId !== "behavior/block") {
          nonBlockMoveActions.push(action.action);
        }
      }
    }
    if (nonBlockMoveActions.length > 0) {
      const action = findNetMoveAction(nonBlockMoveActions);
      for (const cause of nonBlockMoveActions) {
        cause.chain(action);
      }
      returnedActions.push(action);
    } else {
      const action = new MoveAction(0 as Tile, 0 as Tile);
      action.cancelled = true;
      for (const cause of actions) {
        cause.action.chain(action);
      }
      returnedActions.push(action);
    }
    return returnedActions;
  }
}

type Context = EntityManagerState & BehaviorCacheState;
export const BlockEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    typeof BehaviorComponent | typeof SpriteComponent2 | typeof IdComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    IdComponent.add(entity);

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/block"
    });

    if (!state.hasBehavior(entity.behaviorId)) {
      state.addBehavior(entity.behaviorId, new MyBehavior());
    }

    const animation = new Animation([
      new AnimationClip("default", 0, [
        new KeyframeTrack("default", new Float32Array(1), [IMAGES.crate])
      ])
    ]);

    SpriteComponent2.add(entity, {
      animation
    });

    IsGameEntityTag.add(entity);

    return entity;
  },
  destroy(entity) {
    SpriteComponent2.remove(entity);
    BehaviorComponent.remove(entity);
    return entity;
  }
};
