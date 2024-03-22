import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { Changed, IQueryResults, Not, Some } from "../Query";
import { SystemWithQueries } from "../System";
import {
  BehaviorComponent,
  PendingActionTag,
  SpriteComponent2
} from "../components";
import { fetch, window } from "../globals";
import { EntityManagerState, QueryState } from "../state";

export class ClientSystem extends SystemWithQueries<QueryState> {
  #changedSprite = Changed(SpriteComponent2);
  #changedBehavior = Changed(BehaviorComponent);
  queryDefMap = {
    changedAndInactive: {
      components: [
        Some(this.#changedSprite, this.#changedBehavior),
        Not(PendingActionTag)
      ]
    }
  };
  declare changedAndInactive: IQueryResults<
    typeof SpriteComponent2 | typeof BehaviorComponent
  >;
  #client = new NetworkedEntityClient(fetch.bind(window));
  start(context: QueryState & EntityManagerState) {
    super.start(context);
    this.#client.load(context);
  }
  update() {
    for (const entity of this.changedAndInactive) {
      this.#changedSprite.remove(entity);
      this.#changedBehavior.remove(entity);
      PendingActionTag.add(entity);
      this.#client.saveEntity(entity).finally(() => {
        PendingActionTag.remove(entity);
        this.#changedSprite.remove(entity);
        this.#changedBehavior.remove(entity);
      });
    }
  }
}
