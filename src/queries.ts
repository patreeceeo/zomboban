import { WorldIdComponent } from "./components";
import { state } from "./state";

export const WorldIdQuery = state
  .buildQuery([WorldIdComponent])
  .addParam("worldId", 0)
  .complete(({ entityId, worldId }) => {
    return state.get(WorldIdComponent, entityId) === worldId;
  });
