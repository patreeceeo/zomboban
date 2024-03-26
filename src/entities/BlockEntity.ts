import { Animation, AnimationClip, KeyframeTrack } from "../Animation";
import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { MoveAction, PushAction } from "../actions";
import {
  AddedTag,
  BehaviorComponent,
  IdComponent,
  IsGameEntityTag,
  SpriteComponent2,
  createObservableEntity
} from "../components";
import { IMAGES } from "../constants";
import { BehaviorCacheState, EntityManagerState } from "../state";
import { Action, ActionDriver } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";

/** find the net effect of multiple move actions */
function findNetActions(actions: ReadonlyArray<PushAction>) {
  const push = new PushAction(0 as Tile, 0 as Tile);
  const move = new MoveAction(0 as Tile, 0 as Tile);
  for (const action of actions) {
    move.delta.x += action.delta.x;
    move.delta.y += action.delta.y;
    push.delta.x += action.delta.x;
    push.delta.y += action.delta.y;
  }
  move.chain(push);
  return [move, push] as const;
}

export class BlockBehavior extends Behavior<any, any> {
  static id = "behavior/block";
  mapInput(): void {}
  chain(
    actions: ReadonlyArray<ActionDriver<any, any>>,
    _entity: ReadonlyRecursive<ReturnType<typeof BlockEntity.create>>
  ) {
    const returnedActions: Action<
      ReturnType<typeof BlockEntity.create>,
      any
    >[] = [];
    const nonBlockActions = [];
    for (const action of actions) {
      if (action.action instanceof PushAction) {
        if (action.entity.behaviorId !== "behavior/block") {
          nonBlockActions.push(action.action);
        }
      }
    }
    if (nonBlockActions.length > 0) {
      const [move, push] = findNetActions(nonBlockActions);
      for (const cause of nonBlockActions) {
        cause.chain(move);
      }
      returnedActions.push(move, push);
    } else {
      const push = new PushAction(0 as Tile, 0 as Tile);
      push.cancelled = true;
      for (const cause of actions) {
        cause.action.chain(push);
      }
      returnedActions.push(push);
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
    const entity = state.addEntity(createObservableEntity);

    IdComponent.add(entity);

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/block"
    });

    const animation = new Animation([
      new AnimationClip("default", 0, [
        new KeyframeTrack("default", new Float32Array(1), [IMAGES.crate])
      ])
    ]);

    SpriteComponent2.add(entity, {
      animation
    });

    IsGameEntityTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    SpriteComponent2.remove(entity);
    BehaviorComponent.remove(entity);
    IsGameEntityTag.remove(entity);
    return entity;
  }
};
