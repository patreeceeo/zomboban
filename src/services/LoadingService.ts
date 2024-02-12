import { executeFilterQuery } from "../Query";
import { PromiseComponent } from "../components";
import {
  LoadingState,
  LoadingStateComponent,
} from "../components/LoadingState";
import { state } from "../state";

const ids: Array<number> = [];

function LoadingServiceUpdate() {
  ids.length = 0;
  executeFilterQuery(
    (id: number) => {
      return (
        state.has(PromiseComponent, id) &&
        state.is(LoadingStateComponent, id, LoadingState.Started)
      );
    },
    ids,
    state.addedEntities,
  );

  for (const id of ids) {
    const promise = state.get(PromiseComponent, id);
    promise
      .then(() => {
        state.set(LoadingStateComponent, id, LoadingState.Completed);
      })
      .catch(() => {
        state.set(LoadingStateComponent, id, LoadingState.Failed);
      });
  }
}

export const LoadingService = {
  update: LoadingServiceUpdate,
  interval: 100,
};
