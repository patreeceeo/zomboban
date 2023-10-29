import {System} from "../System";
import {executeFilterQuery, and} from "../Query";
import {setImage, Image, getImage, hasImage} from "../components/Image";
import {LoadingState, hasLoadingPreCompleted, hasLoadingQueued, setLoadingState} from "../components/LoadingState";

export function LoadingSystem(): System {
  const imageIds: Array<number> = [];
  return {
    execute: () => {
      imageIds.length = 0;
      executeFilterQuery(and(hasImage, hasLoadingQueued), imageIds)

      for (const imageId of imageIds) {
        const image = getImage(imageId);
        image.onload = () => {
          setLoadingState(imageId, LoadingState.PreCompleted)
        }
        image.onerror = (e) => {
          console.error(e);
          setLoadingState(imageId, LoadingState.Failed)
        }
        image.startLoading();

        console.log(`Started loading image ${imageId} from ${image.src}`);
      }

      imageIds.length = 0;
      executeFilterQuery(and(hasImage, hasLoadingPreCompleted), imageIds)

      for (const imageId of imageIds) {
        const image = getImage(imageId);
        console.log(`Loading complete for image ${imageId} from ${image.src}`);
        setLoadingState(imageId, LoadingState.Completed)
      }
    }
  }
}

export function queueImageLoading(entityId: number, url: string): void {
  const image = new Image(url);
  setImage(entityId, image)
  setLoadingState(entityId, LoadingState.Queued)
}

