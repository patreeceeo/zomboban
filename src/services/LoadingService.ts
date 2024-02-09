import { executeFilterQuery, and } from "../Query";
import { LoadingState } from "../components/LoadingState";
import { mutState, state } from "../state";

const ids: Array<number> = [];

function LoadingServiceUpdate() {
  ids.length = 0;
  executeFilterQuery(
    and(state.hasPromise, state.isLoadingStarted),
    ids,
    state.addedEntities,
  );

  for (const id of ids) {
    const promise = state.getPromise(id);
    promise
      .then(() => {
        mutState.setLoadingState(id, LoadingState.Completed);
      })
      .catch(() => {
        mutState.setLoadingState(id, LoadingState.Failed);
      })
      .finally(() => {
        mutState.removePromise(id);
      });
  }
}

export const LoadingService = {
  update: LoadingServiceUpdate,
  interval: 100,
};
