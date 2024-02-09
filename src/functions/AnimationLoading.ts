import { Animation, AnimationSource } from "../components/Animation";
import { LoadingState } from "../components/LoadingState";
import { mutState } from "../state";

function queueAnimationLoading(entityId: number, src: AnimationSource) {
  const animation = new Animation(src);
  mutState.setAnimation(entityId, animation);
  mutState.setPromise(entityId, animation.load());
  mutState.setLoadingState(entityId, LoadingState.Started);
}

export function batchQueueAnimationLoading(
  batch: ReadonlyArray<readonly [number, AnimationSource]>,
) {
  for (const [id, src] of batch) {
    queueAnimationLoading(id, src);
  }
}
