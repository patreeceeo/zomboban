import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { SystemWithQueries } from "../System";
import { ChangedTag, IsGameEntityTag } from "../components";
import { KEY_MAPS } from "../constants";
import { fetch, window } from "../globals";
import {
  EntityManagerState,
  InputState,
  QueryState,
  TimeState
} from "../state";

type State = QueryState & EntityManagerState & InputState & TimeState;

// let updateCount = 0;

export class ClientSystem extends SystemWithQueries<State> {
  changed = this.createQuery([ChangedTag, IsGameEntityTag]);
  #client = new NetworkedEntityClient(fetch.bind(window));
  #lastSaveTime = -Infinity;
  #save() {
    console.log("changed entity count", this.changed.size);
    for (const entity of this.changed) {
      ChangedTag.remove(entity);
      this.#client.saveEntity(entity);
    }
  }
  start(context: State) {
    super.start(context);
    this.#client.load(context);
  }
  update(state: State) {
    // console.log("update", updateCount++);
    if (state.inputPressed === KEY_MAPS.SAVE) {
      console.log("pressed save");
      if (state.time - this.#lastSaveTime > 200) {
        console.log("enough time has passed");
        this.#save();
        if (this.changed.size > 0) {
          console.log("updating last save time");
          this.#lastSaveTime = state.time;
        }
      }
    }
  }
}
