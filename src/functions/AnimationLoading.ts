import { Animation, AnimationSource } from "../components/Animation";
import { LoadingState } from "../components/LoadingState";
import { state } from "../state";

function queueAnimationLoading(entityId: number, src: AnimationSource) {
  const animation = new Animation(src);
  state.setAnimation(entityId, animation);
  state.setPromise(entityId, animation.load());
  state.setLoadingState(entityId, LoadingState.Started);
}

export function batchQueueAnimationLoading(
  batch: ReadonlyArray<readonly [number, AnimationSource]>,
) {
  for (const [id, src] of batch) {
    queueAnimationLoading(id, src);
  }
}
