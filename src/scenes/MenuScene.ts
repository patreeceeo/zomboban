import { Scene } from "../Scene";
import { ReservedEntity } from "../entities";
import { LoadingService } from "../services/LoadingService";
import { QC } from "../components";
import { Button, ButtonStyle } from "../guis/Button";
import { hasLoadingCompleted } from "../components/LoadingState";
import { RouteId, routeTo } from "../Router";
import { Menu } from "../guis/Menu";
import { Sprite } from "pixi.js";
import { Key, createInputQueue } from "../Input";
import { debounce } from "lodash";
import { KEY_MAPS } from "../constants";
import { setCurrentLevelId } from "../components/LevelId";
import { stopRenderSystem } from "../systems/RenderSystem";
import { state } from "../state";

const MENU_ITEMS = [
  {
    label: "level 1",
    onSelect: () => {
      setCurrentLevelId(1);
      routeTo(RouteId.GAME);
    },
  },
  {
    label: "level 2",
    onSelect: () => {
      setCurrentLevelId(1);
      routeTo(RouteId.GAME);
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
      hasLoadingCompleted(ReservedEntity.GUI_BUTTON_IMAGE) &&
      hasLoadingCompleted(ReservedEntity.HAND_CURSOR_IMAGE) &&
      !this.#hasLoaded
    ) {
      const buttonTexture = QC.getImage(ReservedEntity.GUI_BUTTON_IMAGE)
        .texture!;
      const cursorTexture = QC.getImage(ReservedEntity.HAND_CURSOR_IMAGE)
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
    }

    if (inputQueue.length > 0) {
      const input = inputQueue.shift()!;
      if (input in KEY_MAPS.MOVE) {
        menu.focusIndex += KEY_MAPS.MOVE[input as Key]![1];
      } else if (menu.focusSprite?.visible) {
        MENU_ITEMS[menu.focusIndex].onSelect();
      }
    }
  };
  stop() {
    state.pixiApp.stage.removeChild(this.#menu);
  }
  services = [LoadingService];
}
