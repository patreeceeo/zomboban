import { PromiseComponent } from "../components";
import { Image, ImageComponent } from "../components/Image";
import {
  LoadingState,
  LoadingStateComponent,
} from "../components/LoadingState";
import { state } from "../state";

function queueImageLoading(entityId: number, url: string): void {
  const image = new Image(url);
  state.set(ImageComponent, entityId, image);
  state.set(PromiseComponent, entityId, image.load());
  state.set(LoadingStateComponent, entityId, LoadingState.Started);
}

export function batchQueueImageLoading(
  batch: ReadonlyArray<readonly [number, string]>,
) {
  for (const [id, url] of batch) {
    queueImageLoading(id, url);
  }
}
