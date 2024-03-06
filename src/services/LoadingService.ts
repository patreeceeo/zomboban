import { executeFilterQuery } from "../Query";
import { PromiseComponent } from "../components";
import {
  LoadingState,
  LoadingStateComponentOld
} from "../components/LoadingState";
import { stateOld } from "../state";

const ids: Array<number> = [];

function LoadingServiceUpdate() {
  ids.length = 0;
  executeFilterQuery(
    (id: number) => {
      return (
        stateOld.has(PromiseComponent, id) &&
        stateOld.has(LoadingStateComponentOld, id) &&
        stateOld.is(LoadingStateComponentOld, id, LoadingState.Started)
      );
    },
    ids,
    stateOld.addedEntities
  );

  for (const id of ids) {
    const promise = stateOld.get(PromiseComponent, id);
    promise
      .then(() => {
        stateOld.set(LoadingStateComponentOld, id, LoadingState.Completed);
      })
      .catch(() => {
        stateOld.set(LoadingStateComponentOld, id, LoadingState.Failed);
      });
  }
}

export const LoadingService = {
  update: LoadingServiceUpdate,
  interval: 100
};
