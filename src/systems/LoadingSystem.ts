import {System} from "../System";
import {executeFilterQuery, not, and} from "../Query";
import {setImage, Image, getImage, hasImage} from "../components/Image";
import {getIsLoading, hasIsLoading, setIsLoading} from "../components/IsLoading";

export function LoadingSystem(): System {
  const imageIds: Array<number> = [];
  return {
    execute: () => {
      imageIds.length = 0;
      executeFilterQuery(and(hasImage, not(isImageLoadingStarted)), imageIds)

      for (const imageId of imageIds) {
        const image = getImage(imageId);
        image.startLoading();
        console.log(`Started loading image ${imageId} from ${image.src}`);
        setIsLoading(imageId, true)
      }

      imageIds.length = 0;
      executeFilterQuery(and(hasImage, hasIsLoading, getIsLoading, isImageLoadingComplete), imageIds)

      for (const imageId of imageIds) {
        const image = getImage(imageId);
        console.log(`Loading complete for image ${imageId} from ${image.src}`);
        setIsLoading(imageId, false)
      }
    }
  }
}

export function queueImageLoading(entityId: number, url: string): void {
  const image = new Image(url);
  setImage(entityId, image)
}

export function isImageLoadingStarted(entityId: number): boolean {
  const image = getImage(entityId);
  return image.isLoadingStarted;
}

export function isImageLoadingComplete(entityId: number): boolean {
  const image = getImage(entityId);
  return image.isLoaded;
}
