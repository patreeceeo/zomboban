import { EntityWithComponents } from "../Component";
import { invariant } from "../Error";
import { Matrix } from "../Matrix";
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
  static id = "behavior/unknown";
  abstract mapInput(
    entity: Entity,
    context: Context
  ): Action<Entity, any>[] | void;
  abstract chain(
    actions: ReadonlyArray<ActionDriver<Entity, any>>,
    entity: Entity
  ): Action<Entity, any>[] | void;
}

export const ACTION_CHAIN_LENGTH_MAX = 4;

function addActionDrivers(
  target: ActionDriver<any, any>[],
  source: Action<any, any>[],
  entity: any,
  length: number
) {
  const previousLength = target.length;
  target.length = length;
  let i = 0;
  for (const action of source) {
    target[i + previousLength] = new ActionDriver(action, entity);
    i++;
  }
  return target;
}

type BehaviorSystemContext = BehaviorCacheState &
  InputState &
  TilesState &
  QueryState &
  ActionsState;

const actionEffectField = new Matrix<ActionDriver<any, any>[]>();

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
    let actionSet: ActionDriver<any, any>[] | undefined = undefined;

    if (state.undo) return; // EARLY RETURN!

    for (const entity of this.#inputActors!) {
      const behavior = state.getBehavior(entity.behaviorId);
      const actions = behavior.mapInput(entity, state);
      if (actions) {
        actionSet = actionSet || [];
        addActionDrivers(
          actionSet,
          actions,
          entity,
          actionSet.length + actions.length
        );
      }
    }
    state.inputs.length = 0;

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
      for (const driver of actionSet!) {
        for (const { x, y } of driver.action.effectedArea) {
          actionEffectField.set(x, y, actionEffectField.get(x, y) || []);
          actionEffectField.get(x, y)!.push(driver);
        }
      }

      actionSet.length = 0;
      for (const [x, y, actionsAtTile] of actionEffectField.entries()) {
        const effectedEntities = state.tiles.get(x, y);
        // if (action instanceof MoveAction) {
        //   console.log(
        //     `move action ${action.id} is effecting`,
        //     effectedEntities
        //       ? effectedEntities.map((e) => (e as any).id).join(", ")
        //       : "nothing",
        //     "at",
        //     x,
        //     y
        //   );
        // }
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
            const reactedActionSet = behavior.chain(actionsAtTile, entity);
            if (reactedActionSet) {
              for (const action of reactedActionSet) {
                invariant(
                  action.cause !== undefined,
                  `Re-Action ${action.id} has no cause`
                );
                invariant(
                  action.cause.dependsOn.includes(action),
                  `Re-Action ${action.id}'s cause does not depend on it`
                );
              }
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
      actionEffectField.clear();
      state.pendingActions.push(...actionSet);
    }
  }
}
