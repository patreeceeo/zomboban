import {invariant} from "../Error";

export class Image {
  #isLoaded = false;
  #isLoadingStarted = false;
  #renderable: HTMLImageElement | null = null;
  constructor(readonly src: string) {}

  get isLoaded(): boolean {
    return this.#isLoaded;
  }

  get isLoadingStarted(): boolean {
    return this.#isLoadingStarted;
  }

  get renderable(): HTMLImageElement | null {
    return this.#renderable;
  }

  startLoading(): void {
    const image = new window.Image();
    image.onload = () => {
      this.#isLoaded = true;
    };
    image.src = this.src;
    this.#isLoadingStarted = true;
    this.#renderable = image;
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
