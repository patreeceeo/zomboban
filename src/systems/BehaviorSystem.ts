import { EntityWithComponents } from "../Component";
import { IQueryResults } from "../Query";
import { System } from "../System";
import {
  BehaviorComponent,
  InputReceiverTag,
  IsActiveTag
} from "../components";
import {
  ActionsState,
  BehaviorCacheState,
  InputState,
  QueryState,
  TilesState
} from "../state";
import { Action, ActionDriver } from "./ActionSystem";

export abstract class Behavior<
  Entity extends EntityWithComponents<typeof BehaviorComponent>,
  Context
> {
  abstract mapInput(
    entity: Entity,
    context: Context
  ): Action<Entity, any>[] | void;
  abstract react(
    actions: ReadonlyArray<ActionDriver<Entity, any>>
  ): Action<Entity, any>[] | void;
}

function addActionDrivers(
  target: ActionDriver<any, any>[],
  source: Action<any, any>[],
  entity: any,
  length: number
) {
  target.length = length;
  let i = 0;
  for (const action of source) {
    target[i] = new ActionDriver(action, entity);
    i++;
  }
  return target;
}

type BehaviorSystemContext = BehaviorCacheState &
  InputState &
  TilesState &
  QueryState &
  ActionsState;

export class BehaviorSystem extends System<BehaviorSystemContext> {
  #inputActors:
    | IQueryResults<typeof BehaviorComponent | typeof InputReceiverTag>
    | undefined;
  start(state: BehaviorSystemContext) {
    this.#inputActors = state.query([
      BehaviorComponent,
      InputReceiverTag,
      IsActiveTag
    ]);
  }
  update(state: BehaviorSystemContext) {
    let actionSet: ActionDriver<any, any>[];
    for (const entity of this.#inputActors!) {
      const behavior = state.getBehavior(entity.behaviorId);
      const actions = behavior.mapInput(entity, state);
      if (actions) {
        actionSet = [];
        addActionDrivers(actionSet, actions, entity, actions.length);
      }
    }
    state.inputs.length = 0;
    if (actionSet!) {
      for (const { action } of actionSet!) {
        for (const { x, y } of action.effectedArea) {
          const effectedEntities = state.tiles.get(x, y);
          if (effectedEntities) {
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
              const reactedActionSet = behavior.react(actionSet);
              if (reactedActionSet) {
                addActionDrivers(
                  actionSet,
                  reactedActionSet,
                  entity,
                  actionSet.length + reactedActionSet.length
                );
              }
            }
          }
        }
      }

      state.pendingActions.push(...actionSet);
    }
  }
}
