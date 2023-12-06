import { Sprite } from "pixi.js";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";
import { ComponentName, initComponentData } from "../ComponentData";

const NAME = ComponentName.Sprite;
const DATA = initComponentData(NAME) as Sprite[];
export const SPRITE_SIZE = [64, 92];

export function setSprite(entityId: number, value: Sprite) {
  if (DATA[entityId] !== value) {
    setRenderStateDirty();
    DATA[entityId] = value;
  }
}

export function hasSprite(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getSprite(entityId: number): Sprite {
  invariant(hasSprite(entityId), `Entity ${entityId} does not have a Sprite`);
  return DATA[entityId];
}
