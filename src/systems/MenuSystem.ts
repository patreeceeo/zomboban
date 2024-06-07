import { Key, KeyCombo } from "../Input";
import { System } from "../System";
import { LitMenuApp } from "../litComponents";
import { InputState } from "../state";

export class Menu {
  constructor(
    public title = "Menu",
    readonly items = [] as MenuItem[]
  ) {}
  moveSelectionBy(selectedIndex: number, count: number) {
    let newIndex = selectedIndex;
    let tryIndex = newIndex;
    const { items } = this;
    const itemCount = items.length;
    while (count !== 0) {
      tryIndex = tryIndex + count;
      if (tryIndex > itemCount - 1 || tryIndex < 0) {
        break;
      }
      if (items[tryIndex].selectable) {
        newIndex = tryIndex;
        break;
      }
    }
    return newIndex;
  }
}

const noop = () => {};

export class MenuItem {
  selectable: boolean;
  constructor(
    readonly content: string,
    readonly onConfirm = noop
  ) {
    this.selectable = onConfirm !== noop;
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
      if (!menu.items[menuEl.selectedIndex].selectable) {
        menuEl.selectedIndex = menuEl.menu.moveSelectionBy(
          menuEl.selectedIndex,
          1
        );
      }
    }
    update(context: InputState) {
      const { menuEl } = this;
      const input = context.inputs[0];
      const move = MOVE_FOR_INPUT[input] ?? 0;

      menuEl.selectedIndex = menuEl.menu.moveSelectionBy(
        menuEl.selectedIndex,
        move
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
