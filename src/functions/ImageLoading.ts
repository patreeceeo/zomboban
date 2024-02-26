import { PromiseComponent, TextureComponent } from "../components";
import {
  LoadingState,
  LoadingStateComponent,
} from "../components/LoadingState";
import { state } from "../state";
import { TextureLoader } from "three";

const loader = new TextureLoader();

function queueImageLoading(entityId: number, url: string): void {
  state.set(
    PromiseComponent,
    entityId,
    new Promise((resolve) => {
      state.set(TextureComponent, entityId, loader.load(url, resolve));
    }),
  );
  state.set(LoadingStateComponent, entityId, LoadingState.Started);
}

export function batchQueueImageLoading(
  batch: ReadonlyArray<readonly [number, string]>,
) {
  for (const [id, url] of batch) {
    queueImageLoading(id, url);
  }
}
