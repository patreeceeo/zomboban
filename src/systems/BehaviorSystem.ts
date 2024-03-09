import { World } from "../EntityManager";
import { IQueryResults } from "../Query";
import { System } from "../System";
import { BehaviorComponent, IsActiveTag } from "../components";
import { State } from "../state";
import { Action } from "./ActionSystem";

export abstract class Behavior<Entity, Context extends World> {
  abstract act(entity: Entity, context: Context): Action<Entity, Context>[];
  abstract react(
    actions: Action<Entity, Context>[],
    entity: Entity,
    context: Context
  ): Action<Entity, Context>[];
}

export class BehaviorSystem extends System<State> {
  #behaviors: IQueryResults<typeof BehaviorComponent> | undefined;
  start(state: State) {
    this.#behaviors = state.query([BehaviorComponent, IsActiveTag]);
  }
  update(state: State) {
    for (const entity of this.#behaviors!) {
      const behavior = state.getBehavior(entity.behaviorId);
      behavior.act(entity, state);
    }
  }
}
