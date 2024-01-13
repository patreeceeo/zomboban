import { invariant } from "../Error";
import { Texture, Resource } from "pixi.js";
import { setRenderStateDirty } from "../systems/RenderSystem";
import { defineComponent } from "../Component";
import { ImageConstructor } from "../globals";

export class Image {
  #texture: Texture<Resource> | null = null;

  onload = (_event: Event) => {};
  onerror = (_event: string | Event) => {};
  constructor(public src: string) {}

  get texture(): Texture<Resource> | null {
    return this.#texture;
  }

  startLoading(): void {
    const image = new ImageConstructor();
    image.src = this.src;
    image.onload = (event) => {
      this.#texture = Texture.from(image as HTMLImageElement);
      this.onload(event);
    };
    image.onerror = this.onerror!;
  }

  copy(src: Image): void {
    this.src = src.src;
    if (src.#texture !== null) {
      this.#texture = src.#texture!.clone();
    }
  }

  clone(): Image {
    const clone = new Image(this.src);
    clone.copy(this);
    return clone;
  }

  get isLoaded(): boolean {
    return this.#texture !== null;
  }

  flipX(): Image {
    invariant(this.isLoaded, "Image must be finished loading first");
    this.#texture!.rotate = 12;
    return this;
  }

  flipY(): Image {
    invariant(this.isLoaded, "Image must be finished loading first");
    this.#texture!.rotate = 8;
    return this;
  }
}

const DATA = defineComponent(
  "Image",
  [],
  hasImage,
  getImage,
  setImage,
  removeImage,
);

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

export function removeImage(entityId: number) {
  delete DATA[entityId];
}
