import { Key, KeyCombo } from "../Input";
import { System } from "../System";
import { LitMenuApp } from "../litComponents";
import { InputState } from "../state";

export class Menu {
  constructor(
    public title = "Menu",
    readonly items = [] as MenuItem[]
  ) {}
}

const noop = () => {};

export class MenuItem {
  #description = "";
  constructor(
    readonly title: string,
    readonly onConfirm = noop
  ) {}
  addDescription(description: string) {
    this.#description = description;
    return this;
  }
  get description() {
    return this.#description;
  }
}

const MOVE_FOR_INPUT = {
  [Key.ArrowUp]: -1,
  [Key.ArrowDown]: 1
} as Record<KeyCombo, number>;

declare const uiRootElement: HTMLElement;
export function createMenuSystem(menu: Menu) {
  class MenuSystem extends System<InputState> {
    menuEl = document.createElement(`lit-menu-app`) as LitMenuApp;
    start() {
      const { menuEl } = this;
      menuEl.menu = menu;
      uiRootElement.appendChild(menuEl);
    }
    update(context: InputState) {
      const { menuEl } = this;
      const input = context.inputs[0];
      const move = MOVE_FOR_INPUT[input] ?? 0;
      menuEl.selectedIndex = Math.max(
        0,
        Math.min(menuEl.menu.items.length - 1, menuEl.selectedIndex + move)
      );

      if (input === Key.Enter) {
        const item = menuEl.menu.items[menuEl.selectedIndex];
        item.onConfirm();
      }
    }
    stop() {
      this.menuEl.remove();
    }
  }
  return MenuSystem;
}
