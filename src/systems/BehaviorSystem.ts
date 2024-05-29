import { EntityWithComponents } from "../Component";
import { Matrix } from "../Matrix";
import { SystemWithQueries } from "../System";
import { AddedTag, BehaviorComponent, IsActiveTag } from "../components";
import {
  ActionsState,
  BehaviorCacheState,
  InputState,
  QueryState,
  TilesState
} from "../state";
import { Action, ActionEntity } from "./ActionSystem";

export abstract class Behavior<
  Entity extends EntityWithComponents<typeof BehaviorComponent>,
  Context
> {
  static id = "behavior/unknown";
  onEnter(
    entity: Entity,
    context: Context
  ): Action<ActionEntity<any>, any>[] | void {
    void entity;
    void context;
  }
  onUpdate(
    entity: Entity,
    context: Context
  ): Action<ActionEntity<any>, any>[] | void {
    void entity;
    void context;
  }
  onReceive(
    actions: ReadonlyArray<Action<Entity, any>>,
    entity: Entity,
    context: Context
  ): Action<ActionEntity<any>, any>[] | void {
    void actions;
    void entity;
    void context;
  }
}

export const ACTION_CHAIN_LENGTH_MAX = 4;

function addActions(
  target: Action<any, any>[],
  source: Action<any, any>[],
  length: number
) {
  const previousLength = target.length;
  target.length = length;
  let i = 0;
  for (const action of source) {
    target[i + previousLength] = action;
    i++;
  }
  return target;
}

type BehaviorSystemContext = BehaviorCacheState &
  TilesState &
  QueryState &
  ActionsState &
  InputState;

const actionEffectField = new Matrix<Action<any, any>[]>();

export class BehaviorSystem extends SystemWithQueries<BehaviorSystemContext> {
  #actors = this.createQuery([BehaviorComponent, IsActiveTag, AddedTag]);
  start(state: BehaviorSystemContext) {
    const resource = this.#actors.stream((entity) => {
      const behavior = state.getBehavior(entity.behaviorId);
      if (!behavior) {
        console.warn(`Behavior ${entity.behaviorId} not found`);
        return;
      }
      entity.actions.clear();
      const actions = behavior.onEnter(entity, state);
      if (actions) {
        state.pendingActions.push(...actions);
      }
    });
    this.resources.push(resource);
  }
  update(state: BehaviorSystemContext) {
    let actionSet: Action<any, any>[] | undefined = undefined;

    if (state.undoInProgress) return; // EARLY RETURN!

    for (const entity of this.#actors!) {
      const behavior = state.getBehavior(entity.behaviorId);
      const actions = behavior.onUpdate(entity, state);
      if (actions) {
        actionSet ||= [];
        addActions(actionSet, actions, actionSet.length + actions.length);
      }
    }
    if (actionSet) {
      state.pendingActions.push(...actionSet);
    }
    let chainLength = 0;
    while (
      actionSet &&
      actionSet.length > 0 &&
      chainLength < ACTION_CHAIN_LENGTH_MAX
    ) {
      chainLength++;
      for (const action of actionSet!) {
        for (const { x, y } of action.listEffectedTiles()) {
          const actions = actionEffectField.get(x, y) || [];
          actions.push(action);
          actionEffectField.set(x, y, actions);
        }
      }

      actionSet.length = 0;
      for (const [x, y, actionsAtTile] of actionEffectField.entries()) {
        // TODO store actions in tile matrix
        const effectedEntities = state.tiles.get(x, y);
        if (effectedEntities) {
          // for (const action of actionsAtTile) {
          //   console.log(
          //     `action ${action.action.id} is effecting`,
          //     effectedEntities.map((e) => (e as any).id).join(", "),
          //     "at",
          //     x,
          //     y
          //   );
          // }
          const effectedEntitiesWithBehavior = [] as EntityWithComponents<
            typeof BehaviorComponent
          >[];
          for (const entity of effectedEntities) {
            if (BehaviorComponent.has(entity)) {
              effectedEntitiesWithBehavior.push(entity);
            }
          }

          for (const entity of effectedEntitiesWithBehavior) {
            const behavior = state.getBehavior(entity.behaviorId);
            const reactedActionSet = behavior.onReceive(
              actionsAtTile,
              entity,
              state
            );
            if (reactedActionSet) {
              addActions(
                actionSet,
                reactedActionSet,
                actionSet.length + reactedActionSet.length
              );
            }
          }
        }
      }

      actionEffectField.clear();
      state.pendingActions.push(...actionSet);
    }
  }
}
