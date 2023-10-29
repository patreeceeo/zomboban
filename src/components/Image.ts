import { invariant } from "../Error";
import { Texture, Resource } from "pixi.js";

export class Image {
  #isLoaded = false;
  #isLoadingStarted = false;
  #texture: Texture<Resource> | null = null;
  constructor(readonly src: string) {}

  get isLoaded(): boolean {
    return this.#isLoaded;
  }

  get isLoadingStarted(): boolean {
    return this.#isLoadingStarted;
  }

  get texture(): Texture<Resource> | null {
    return this.#texture;
  }

  async startLoading(): Promise<void> {
    this.#isLoadingStarted = true;
    const image = new window.Image();
    image.src = this.src;
    image.onload = () => {
      this.#isLoaded = true;
      this.#texture = Texture.from(image);
    };
  }
}

const DATA: Array<Image> = [];

export function setImage(entityId: number, value: Image) {
  DATA[entityId] = value;
}

export function hasImage(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getImage(entityId: number): Image {
  invariant(hasImage(entityId), `Entity ${entityId} does not have an Image`);
  return DATA[entityId];
}
