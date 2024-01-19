import { Container } from "pixi.js";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";

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
  }

  addItem(...containers: readonly Container[]) {
    const { height, width, itemHeight } = this.settings;
    const items = this.#items;
    this.#items.push(...containers);
    this.addChild(...containers);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      item.x = width / 2;
      item.y = height / 2 + (i - items.length / 2) * itemHeight;
    }
  }
}
