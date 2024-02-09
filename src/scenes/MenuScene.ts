import { Scene } from "../Scene";
import { ReservedEntity } from "../entities";
import { LoadingService } from "../services/LoadingService";
import { Button, ButtonStyle } from "../guis/Button";
import { RouteId, routeTo } from "../Router";
import { Menu } from "../guis/Menu";
import { Sprite } from "pixi.js";
import { Key, createInputQueue } from "../Input";
import { debounce } from "lodash";
import { KEY_MAPS } from "../constants";
import { stopRenderSystem } from "../systems/RenderSystem";
import { mutState, state } from "../state";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";

const MENU_ITEMS = [
  {
    label: "level 1",
    onSelect: async () => {
      routeTo(RouteId.GAME, { world: 0 });
    },
  },
  {
    label: "level 2",
    onSelect: async () => {
      routeTo(RouteId.GAME, { world: 1 });
    },
  },
];

export default class MenuScene implements Scene {
  #menu = new Menu();
  #hasLoaded = false;
  #inputQueue = createInputQueue();
  constructor() {}
  start() {
    stopRenderSystem();
    addEventListener("mousemove", this.hideFocusCursor);
  }
  hideFocusCursor = debounce(() => {
    const focusSprite = this.#menu.focusSprite;
    if (focusSprite) {
      focusSprite.visible = false;
    }
  }, 100);
  update = () => {
    const inputQueue = this.#inputQueue;
    const menu = this.#menu;
    if (
      state.isLoadingCompleted(ReservedEntity.GUI_BUTTON_IMAGE) &&
      state.isLoadingCompleted(ReservedEntity.HAND_CURSOR_IMAGE) &&
      !this.#hasLoaded
    ) {
      const buttonTexture = state.getImage(ReservedEntity.GUI_BUTTON_IMAGE)
        .texture!;
      const cursorTexture = state.getImage(ReservedEntity.HAND_CURSOR_IMAGE)
        .texture!;

      const buttons = MENU_ITEMS.map(({ label, onSelect }) => {
        const button = new Button(new ButtonStyle({ label }));
        button.style.texture = buttonTexture;
        button.onPress.connect(onSelect);
        return button;
      });
      const cursor = new Sprite(cursorTexture);
      cursor.anchor.set(0.01);

      menu.addItem(...buttons);
      menu.focusSprite = cursor;
      this.#hasLoaded = true;
      mutState.pixiApp.stage.addChild(menu);
    }

    if (inputQueue.length > 0) {
      const input = inputQueue.shift()!;
      if (input in KEY_MAPS.MOVE) {
        menu.focusIndex += KEY_MAPS.MOVE[input as Key]![1];
      } else if (menu.focusSprite?.visible) {
        MENU_ITEMS[menu.focusIndex].onSelect();
      }
    }
    EntityOperationSystem();
  };
  stop() {
    mutState.pixiApp.stage.removeChild(this.#menu);
  }
  services = [LoadingService];
}
