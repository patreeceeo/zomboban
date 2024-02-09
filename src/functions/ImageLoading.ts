import { Image } from "../components/Image";
import { LoadingState } from "../components/LoadingState";
import { mutState } from "../state";

function queueImageLoading(entityId: number, url: string): void {
  const image = new Image(url);
  mutState.setImage(entityId, image);
  mutState.setPromise(entityId, image.load());
  mutState.setLoadingState(entityId, LoadingState.Started);
}

export function batchQueueImageLoading(
  batch: ReadonlyArray<readonly [number, string]>,
) {
  for (const [id, url] of batch) {
    queueImageLoading(id, url);
  }
}
