import { invariant } from "../Error";
import { ColorSource, Container, Texture } from "pixi.js";
import {
  getDisplayContainer,
  hasDisplayContainer,
  removeDisplayContainer,
  setDisplayContainer,
} from "./DisplayContainer";

type Sprite = Container & { texture: Texture; tint: number | ColorSource };

export const SPRITE_SIZE = [64, 92];

export function setSprite(entityId: number, value: Sprite) {
  setDisplayContainer(entityId, value);
}

export function hasSprite(entityId: number): boolean {
  if (hasDisplayContainer(entityId)) {
    const container = getDisplayContainer(entityId) as Sprite;
    return container.texture !== undefined && container.tint !== undefined;
  }
  return false;
}

export function getSprite(entityId: number): Sprite {
  invariant(hasSprite(entityId), `Entity ${entityId} does not have a Sprite`);
  return getDisplayContainer(entityId) as Sprite;
}

export function removeSprite(entityId: number): void {
  if (hasSprite(entityId)) {
    removeDisplayContainer(entityId);
  }
}
