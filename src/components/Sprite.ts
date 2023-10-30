import {Sprite} from "pixi.js";
import {invariant} from "../Error";

const DATA: Array<Sprite> = [];
export const SPRITE_SIZE = 32;

export function setSprite(entityId: number, value: Sprite) {
  DATA[entityId] = value;
}

export function hasSprite(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getSprite(entityId: number): Sprite {
  invariant(hasSprite(entityId), `Entity ${entityId} does not have a Sprite`);
  return DATA[entityId];
}
