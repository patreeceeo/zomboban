import { executeFilterQuery, and } from "../Query";
import { getAnimation, hasAnimation } from "../components/Animation";
import { getImage, hasImage } from "../components/Image";
import {
  LoadingState,
  hasLoadingPreCompleted,
  hasLoadingQueued,
  setLoadingState,
} from "../components/LoadingState";
import { setRenderStateDirty } from "./RenderSystem";

const ids: Array<number> = [];

export function LoadingSystem() {
  ids.length = 0;
  executeFilterQuery(and(hasImage, hasLoadingQueued), ids);

  for (const imageId of ids) {
    const image = getImage(imageId);
    image.onload = () => {
      setLoadingState(imageId, LoadingState.PreCompleted);
    };
    image.onerror = () => {
      console.error(`Loading failed for image ${imageId} from ${image.src}`);
      setLoadingState(imageId, LoadingState.Failed);
    };
    image.startLoading();

    console.log(`Started loading image ${imageId} from ${image.src}`);
  }

  ids.length = 0;
  executeFilterQuery(and(hasImage, hasLoadingPreCompleted), ids);

  for (const imageId of ids) {
    const image = getImage(imageId);
    console.log(`Loading complete for image ${imageId} from ${image.src}`);
    setLoadingState(imageId, LoadingState.Completed);
    setRenderStateDirty();
  }

  ids.length = 0;
  executeFilterQuery(and(hasAnimation, hasLoadingQueued), ids);

  for (const animationId of ids) {
    const animation = getAnimation(animationId);
    animation.onload = () => {
      setLoadingState(animationId, LoadingState.PreCompleted);
    };
    animation.onerror = () => {
      console.error(
        `Loading failed for animation ${animationId} from ${animation.src}`,
      );
      setLoadingState(animationId, LoadingState.Failed);
    };
    animation.startLoading();

    console.log(
      `Started loading animation ${animationId} from ${animation.src}`,
    );
  }

  ids.length = 0;
  executeFilterQuery(and(hasAnimation, hasLoadingPreCompleted), ids);

  for (const animationId of ids) {
    const animation = getAnimation(animationId);
    console.log(
      `Loading complete for animation ${animationId} from ${animation.src.from} / ${animation.src.key}`,
    );
    setLoadingState(animationId, LoadingState.Completed);
    setRenderStateDirty();
  }
}
