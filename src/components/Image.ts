import { invariant } from "../Error";
import { Texture, Resource } from "pixi.js";
import { setRenderStateDirty } from "../systems/RenderSystem";

export class Image {
  #texture: Texture<Resource> | null = null;

  onload = (_event: Event) => {};
  onerror = (_event: string | Event) => {};
  constructor(readonly src: string) {}

  get texture(): Texture<Resource> | null {
    return this.#texture;
  }

  startLoading(): void {
    const image = new window.Image();
    image.src = this.src;
    image.onload = (event) => {
      this.#texture = Texture.from(image);
      this.onload(event);
    };
    image.onerror = this.onerror!;
  }
}

const DATA: Array<Image> = [];

export function setImage(entityId: number, value: Image) {
  if (DATA[entityId] !== value) {
    setRenderStateDirty();
    DATA[entityId] = value;
  }
}

export function hasImage(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getImage(entityId: number): Image {
  invariant(hasImage(entityId), `Entity ${entityId} does not have an Image`);
  return DATA[entityId];
}
