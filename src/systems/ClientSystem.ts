import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { Changed, IQueryResults, Not, Some } from "../Query";
import { SystemWithQueries } from "../System";
import {
  BehaviorComponent,
  PendingActionTag,
  SpriteComponent2
} from "../components";
import { KEY_MAPS } from "../constants";
import { fetch, window } from "../globals";
import {
  EntityManagerState,
  InputState,
  QueryState,
  TimeState
} from "../state";

type State = QueryState & EntityManagerState & InputState & TimeState;

export class ClientSystem extends SystemWithQueries<State> {
  #changedSprite = Changed(SpriteComponent2);
  #changedBehavior = Changed(BehaviorComponent);
  queryDefMap = {
    changedAndInactive: {
      components: [
        Some(this.#changedSprite, this.#changedBehavior),
        Not(PendingActionTag)
      ]
    },
    changed: {
      components: [Some(this.#changedSprite, this.#changedBehavior)]
    }
  };
  declare changedAndInactive: IQueryResults<
    typeof SpriteComponent2 | typeof BehaviorComponent
  >;
  declare changed: IQueryResults<
    typeof SpriteComponent2 | typeof BehaviorComponent
  >;
  #client = new NetworkedEntityClient(fetch.bind(window));
  #lastSaveTime = -Infinity;
  #saveRequested = false;
  #save() {
    for (const entity of this.changedAndInactive) {
      this.#changedSprite.remove(entity);
      this.#changedBehavior.remove(entity);
      this.#client.saveEntity(entity).finally(() => {
        this.#changedSprite.remove(entity);
        this.#changedBehavior.remove(entity);
      });
    }
    this.#saveRequested =
      this.changed.size > 0 && this.changedAndInactive.size === 0;
  }
  start(context: State) {
    super.start(context);
    this.#client.load(context);
  }
  update(state: State) {
    if (state.inputPressed === KEY_MAPS.SAVE || this.#saveRequested) {
      const lastSaveTime = this.#lastSaveTime;
      this.#lastSaveTime = state.time;
      if (state.time - lastSaveTime > 200) {
        this.#save();
      }
    }
  }
}