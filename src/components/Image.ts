import { PrimativeArrayComponent } from "../Component";
import { invariant } from "../Error";
import { ImageConstructor } from "../globals";
import { Texture, Resource } from "pixi.js";

export class Image {
  #texture: Texture<Resource> | null = null;

  onload = (_event: Event) => {};
  onerror = (_event: string | Event) => {};
  constructor(public src: string) {}

  get texture(): Texture<Resource> | null {
    return this.#texture;
  }

  load(): Promise<void> {
    const image = new ImageConstructor();
    image.src = this.src;
    return new Promise((resolve, reject) => {
      image.onload = () => {
        this.#texture = Texture.from(image as HTMLImageElement);
        resolve();
      };
      image.onerror = reject;
    });
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

/** @deprecated */
export class ImageComponent extends PrimativeArrayComponent<Image> {
  constructor() {
    super([]);
  }
}
