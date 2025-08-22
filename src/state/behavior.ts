import { Behavior } from "../systems/BehaviorSystem";
import { BehaviorComponent } from "../components";
import { BehaviorEnum } from "../behaviors";
import { EntityWithComponents } from "../Component";
import { invariant } from "../Error";

export class BehaviorState {
  #behaviors: Partial<Record<BehaviorEnum, Behavior<any, any>>> = {};
  
  set(id: BehaviorEnum, behavior: Behavior<any, any>) {
    this.#behaviors[id] = behavior;
  }
  
  has(id: string) {
    return id in this.#behaviors;
  }
  
  get(id: BehaviorEnum): Behavior<any, any> {
    invariant(
      id in this.#behaviors,
      `Behavior ${id} has not been registered`
    );
    return this.#behaviors[id]!;
  }
  
  actorsById = [] as EntityWithComponents<typeof BehaviorComponent>[];
}