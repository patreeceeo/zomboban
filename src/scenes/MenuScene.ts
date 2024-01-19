import { Scene } from "../Scene";
import { ReservedEntity } from "../entities";
import { LoadingService } from "../services/LoadingService";
import { QC } from "../components";
import { Button, ButtonStyle } from "../guis/Button";
import { hasLoadingCompleted } from "../components/LoadingState";
import { RouteId, routeTo } from "../Router";
import { Menu } from "../guis/Menu";
import { Sprite } from "pixi.js";
import { Key, createInputQueue, includesKey } from "../Input";

export default class MenuScene implements Scene {
  #menu = new Menu();
  #hasLoaded = false;
  #inputQueue = createInputQueue();
  constructor() {}
  start() {
    const appId = ReservedEntity.DEFAULT_PIXI_APP;
    const app = QC.getPixiApp(appId);
    app.stage.addChild(this.#menu);
  }
  playGame = () => {
    const appId = ReservedEntity.DEFAULT_PIXI_APP;
    const app = QC.getPixiApp(appId);
    app.stage.removeChild(this.#menu);
    routeTo(RouteId.GAME);
  };
  update = () => {
    const inputQueue = this.#inputQueue;
    const menu = this.#menu;
    if (
      hasLoadingCompleted(ReservedEntity.GUI_BUTTON_IMAGE) &&
      !this.#hasLoaded
    ) {
      const buttonTexture = QC.getImage(ReservedEntity.GUI_BUTTON_IMAGE)
        .texture!;
      const playerTexture = QC.getImage(ReservedEntity.PLAYER_DOWN_IMAGE)
        .texture!;
      const playButton = new Button(new ButtonStyle({ label: "play" }));
      const optionsButton = new Button(new ButtonStyle({ label: "options" }));
      const aboutButton = new Button(new ButtonStyle({ label: "about" }));
      const cursor = new Sprite(playerTexture);
      cursor.anchor.set(0.5);

      playButton.onPress.connect(this.playGame);

      playButton.style.texture = buttonTexture;
      optionsButton.style.texture = buttonTexture;
      aboutButton.style.texture = buttonTexture;

      menu.addItem(playButton, optionsButton, aboutButton);
      menu.focusSprite = cursor;
      this.#hasLoaded = true;
    }

    if (inputQueue.length > 0) {
      const input = inputQueue.shift()!;
      if (includesKey(input, Key.w)) {
        menu.focusIndex--;
      }
      if (includesKey(input, Key.s)) {
        menu.focusIndex++;
      }
    }
  };
  stop() {}
  services = [LoadingService];
}
