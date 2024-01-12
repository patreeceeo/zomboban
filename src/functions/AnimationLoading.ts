import {
  Animation,
  AnimationSource,
  setAnimation,
} from "../components/Animation";
import { LoadingState, setLoadingState } from "../components/LoadingState";

function queueAnimationLoading(entityId: number, src: AnimationSource) {
  const animation = new Animation(src);
  setAnimation(entityId, animation);
  setLoadingState(entityId, LoadingState.Queued);
}

export function batchQueueAnimationLoading(
  batch: ReadonlyArray<readonly [number, AnimationSource]>,
) {
  for (const [id, src] of batch) {
    queueAnimationLoading(id, src);
  }
}
