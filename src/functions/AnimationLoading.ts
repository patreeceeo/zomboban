import { EntityName, getNamedEntity } from "../Entity";
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

export function queueAnimationLoadingAsNamedEntity(
  name: EntityName,
  src: AnimationSource,
) {
  const entityId = getNamedEntity(name);
  queueAnimationLoading(entityId, src);
}

export function batchQueueAnimationLoadingAsNamedEntity(
  batch: Readonly<Partial<Record<EntityName, AnimationSource>>>,
) {
  for (const [name, src] of Object.entries(batch)) {
    queueAnimationLoadingAsNamedEntity(name as EntityName, src);
  }
}
