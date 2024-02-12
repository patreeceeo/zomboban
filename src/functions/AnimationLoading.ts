import { PromiseComponent } from "../components";
import {
  Animation,
  AnimationComponent,
  AnimationSource,
} from "../components/Animation";
import {
  LoadingState,
  LoadingStateComponent,
} from "../components/LoadingState";
import { state } from "../state";

function queueAnimationLoading(entityId: number, src: AnimationSource) {
  const animation = new Animation(src);
  state.set(AnimationComponent, entityId, animation);
  state.set(PromiseComponent, entityId, animation.load());
  state.set(LoadingStateComponent, entityId, LoadingState.Started);
}

export function batchQueueAnimationLoading(
  batch: ReadonlyArray<readonly [number, AnimationSource]>,
) {
  for (const [id, src] of batch) {
    queueAnimationLoading(id, src);
  }
}
