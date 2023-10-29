import {invariant} from "../Error";
import {hasImage} from "./Image";

const DATA: Array<number> = [];

export function setLookLike(entityId: number, imageId: number) {
  invariant(hasImage(imageId), `Image ${imageId} does not exist`);
  DATA[entityId] = imageId;
}

export function hasLookLike(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getLookLike(entityId: number): number {
  invariant(hasLookLike(entityId), `Entity ${entityId} does not have a LookLike`);
  return DATA[entityId];
}
