import { PromiseComponent, TextureComponent } from "../components";
import {
  LoadingState,
  LoadingStateComponent
} from "../components/LoadingState";
import { stateOld } from "../state";
import { TextureLoader } from "three";

const loader = new TextureLoader();

function queueImageLoading(entityId: number, url: string): void {
  stateOld.set(
    PromiseComponent,
    entityId,
    new Promise((resolve) => {
      stateOld.set(TextureComponent, entityId, loader.load(url, resolve));
    })
  );
  stateOld.set(LoadingStateComponent, entityId, LoadingState.Started);
}

export function batchQueueImageLoading(
  batch: ReadonlyArray<readonly [number, string]>
) {
  for (const [id, url] of batch) {
    queueImageLoading(id, url);
  }
}
