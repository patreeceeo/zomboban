import { ComponentName, initComponentData } from "../ComponentData";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";
import { hasAnimation } from "./Animation";
import { hasImage } from "./Image";

const NAME = ComponentName.LookLike;
const DATA = initComponentData(
  NAME,
  [],
  hasLookLike,
  getLookLike,
  setLookLike,
  removeLookLike,
);

export function setLookLike(entityId: number, imageId: number) {
  invariant(
    hasImage(imageId) || hasAnimation(imageId),
    `Image or Animation ${imageId} does not exist`,
  );
  if (imageId !== DATA[entityId]) {
    setRenderStateDirty();
    DATA[entityId] = imageId;
  }
}

export function isLookLike(entityId: number, imageId: number): boolean {
  return DATA[entityId] === imageId;
}

export function hasLookLike(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getLookLike(entityId: number): number {
  invariant(
    hasLookLike(entityId),
    `Entity ${entityId} does not have a LookLike`,
  );
  return DATA[entityId];
}

export function removeLookLike(entityId: number) {
  delete DATA[entityId];
}
