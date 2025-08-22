import { Behavior } from "../systems/BehaviorSystem";
import { BehaviorComponent } from "../components";
import { BehaviorEnum } from "../behaviors";
import { EntityWithComponents } from "../Component";
import { invariant } from "../Error";

export class BehaviorState {
  #map = new Map<BehaviorEnum, Behavior<any, any>>();

  set(id: BehaviorEnum, behavior: Behavior<any, any>) {
    this.#map.set(id, behavior);
  }

  has(id: BehaviorEnum) {
    return this.#map.has(id);
  }

  get(id: BehaviorEnum): Behavior<any, any> {
    invariant(
      this.#map.has(id),
      `Behavior ${id} has not been registered`
    );
    return this.#map.get(id)!;
  }

  actorsById = [] as EntityWithComponents<typeof BehaviorComponent>[];
}
