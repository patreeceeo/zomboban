import { Image } from "../components/Image";
import { LoadingState } from "../components/LoadingState";
import { state } from "../state";

function queueImageLoading(entityId: number, url: string): void {
  const image = new Image(url);
  state.setImage(entityId, image);
  state.setPromise(entityId, image.load());
  state.setLoadingState(entityId, LoadingState.Started);
}

export function batchQueueImageLoading(
  batch: ReadonlyArray<readonly [number, string]>,
) {
  for (const [id, url] of batch) {
    queueImageLoading(id, url);
  }
}
