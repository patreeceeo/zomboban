import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { SystemWithQueries } from "../System";
import { ChangedTag, IsGameEntityTag } from "../components";
import { KEY_MAPS } from "../constants";
import {
  ClientState,
  EntityManagerState,
  InputState,
  QueryState,
  TimeState
} from "../state";

type State = QueryState &
  EntityManagerState &
  InputState &
  TimeState &
  ClientState;

// let updateCount = 0;

export class ClientSystem extends SystemWithQueries<State> {
  changed = this.createQuery([ChangedTag, IsGameEntityTag]);
  async #save(client: NetworkedEntityClient) {
    console.log(`Saving ${this.changed.size} changed entities`);
    for (const entity of this.changed) {
      await client.saveEntity(entity);
      ChangedTag.remove(entity);
    }
  }
  start(context: State) {
    super.start(context);
  }
  update(state: State) {
    // console.log("update", updateCount++);
    if (state.inputPressed === KEY_MAPS.SAVE) {
      // console.log("pressed save");
      let lastSaveRequestTime = state.lastSaveRequestTime;
      state.lastSaveRequestTime = state.time;
      if (state.time - lastSaveRequestTime > 200) {
        // console.log("enough time has passed");
        this.#save(state.client);
        // if (this.changed.size > 0) {
        // console.log("updating last save time");
        // }
      }
    }
  }
}
