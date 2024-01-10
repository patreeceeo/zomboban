import { Text } from "pixi.js";
import { ComponentName, initComponentData } from "../ComponentData";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

const NAME = ComponentName.Text;
const DATA = initComponentData(NAME) as Text[];

/**
 * @fileoverview
 * This component is a bit special, for now. To the user, it's a string, but internally, it's a PIXI.Text object.
 * This is because I want the component to hold the PIXI.Text object, so that I can access it in the RenderSystem,
 * but I don't want the user to have to deal with PIXI.Text objects.
 * Ultimately, I want to have this actually just contain a string, and then have the RenderSystem create the PIXI.Text using this and a few other components, like font size, font family, etc.
 * But that's a bit complicated, so saving it for later.
 */

export function setText(entityId: number, value: string) {
  if (hasText(entityId)) {
    const displayObject = DATA[entityId];
    if (value !== displayObject.text) {
      displayObject.text = value;
      setRenderStateDirty();
    }
  } else {
    const sprite = new Text(value, {
      fill: 0xffffff,
      align: "center",
      fontFamily: "Luminari",
    });
    sprite.resolution = 8;
    sprite.roundPixels = true;
    DATA[entityId] = sprite;
    setRenderStateDirty();
  }
}

export function hasText(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getText(entityId: number): string {
  return getTextSprite(entityId).text;
}

export function getTextSprite(entityId: number): Text {
  invariant(hasText(entityId), `Entity ${entityId} does not have Text`);
  return DATA[entityId];
}
