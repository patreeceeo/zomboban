import { Container, Sprite } from "pixi.js";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { LoopCounter } from "../Counter";

interface MenuSettings {
  height: number;
  width: number;
  itemHeight: number;
}

const defaultSettings: MenuSettings = {
  height: SCREENX_PX,
  width: SCREENY_PX,
  itemHeight: 64,
};

export class Menu extends Container {
  settings = defaultSettings;
  #items: Container[] = [];
  #focusSprite?: Sprite;
  #focusIndex = new LoopCounter(0);
  #itemMaxWidth = 0;
  constructor(inputSettings?: Partial<MenuSettings>) {
    super();
    this.update(inputSettings);
  }

  update(inputSettings?: Partial<MenuSettings>) {
    const { settings } = this;
    if (inputSettings) {
      Object.assign(settings, inputSettings);
    }
    const { height, width } = settings;
    this.height = height;
    this.width = width;
    this.positionFocus();
  }

  positionFocus() {
    const { height, width, itemHeight } = this.settings;
    const focusIndex = this.#focusIndex.value;
    const items = this.#items;
    const focusSprite = this.#focusSprite;
    if (focusSprite) {
      focusSprite.x = (width + this.#itemMaxWidth) / 2 - focusSprite.width / 2;
      focusSprite.y = height / 2 + (focusIndex - items.length / 2) * itemHeight;
      focusSprite.visible = true;
    }
  }

  addItem(...containers: readonly Container[]) {
    const { height, width, itemHeight } = this.settings;
    const items = this.#items;
    this.#items.push(...containers);
    this.addChild(...containers);
    this.#focusIndex.max = items.length - 1;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      item.x = width / 2;
      item.y = height / 2 + (i - items.length / 2) * itemHeight;
      this.#itemMaxWidth = Math.max(this.#itemMaxWidth, item.width);
    }
  }

  set focusSprite(sprite: Sprite | undefined) {
    if (this.#focusSprite) {
      this.removeChild(this.#focusSprite);
    }
    if (sprite) {
      this.#focusSprite = sprite;
      this.addChild(sprite);
      this.positionFocus();
    }
  }

  get focusSprite() {
    return this.#focusSprite;
  }

  set focusIndex(index: number) {
    this.#focusIndex.value = index;
    this.positionFocus();
  }

  get focusIndex() {
    return this.#focusIndex.value;
  }
}
