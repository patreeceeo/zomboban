import { EntityName, addEntity, setNamedEntity } from "../Entity";
import { Image, setImage } from "../components/Image";
import { LoadingState, setLoadingState } from "../components/LoadingState";

function queueImageLoading(entityId: number, url: string): void {
  const image = new Image(url);
  setImage(entityId, image);
  setLoadingState(entityId, LoadingState.Queued);
}

function queueImageLoadingAsNamedEntity(name: EntityName, url: string) {
  const imageId = addEntity();
  queueImageLoading(imageId, url);
  setNamedEntity(name, imageId);
}

export function batchQueueImageLoadingAsNamedEntity(
  batch: Partial<Record<EntityName, string>>,
) {
  for (const [name, url] of Object.entries(batch)) {
    queueImageLoadingAsNamedEntity(name as EntityName, url);
  }
}
