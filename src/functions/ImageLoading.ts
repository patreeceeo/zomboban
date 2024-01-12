import { Image, setImage } from "../components/Image";
import { LoadingState, setLoadingState } from "../components/LoadingState";

function queueImageLoading(entityId: number, url: string): void {
  const image = new Image(url);
  setImage(entityId, image);
  setLoadingState(entityId, LoadingState.Queued);
}

export function batchQueueImageLoading(
  batch: ReadonlyArray<readonly [number, string]>,
) {
  for (const [id, url] of batch) {
    queueImageLoading(id, url);
  }
}
