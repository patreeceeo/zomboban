import { EntityWithComponents } from "../Component";
import { World } from "../EntityManager";
import { IQueryResults } from "../Query";
import { System } from "../System";
import {
  BehaviorComponent,
  InputReceiverTag,
  IsActiveTag
} from "../components";
import { State } from "../state";
import { Action, ActionDriver } from "./ActionSystem";

export abstract class Behavior<
  Entity extends EntityWithComponents<typeof BehaviorComponent>,
  Context extends ReadonlyRecursive<World>
> {
  abstract mapInput(
    entity: Entity,
    context: Context
  ): Action<Entity, Context>[] | void;
  abstract react(
    actions: ReadonlyArray<ActionDriver<Entity, Context>>
  ): Action<Entity, Context>[] | void;
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

export class BehaviorSystem extends System<State> {
  #inputActors:
    | IQueryResults<typeof BehaviorComponent | typeof InputReceiverTag>
    | undefined;
  start(state: State) {
    this.#inputActors = state.query([
      BehaviorComponent,
      InputReceiverTag,
      IsActiveTag
    ]);
  }
  update(state: State) {
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
