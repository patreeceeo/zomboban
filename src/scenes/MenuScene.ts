import { Scene } from "../Scene";
import { ReservedEntity } from "../entities";
import { LoadingService } from "../services/LoadingService";
import { QC } from "../components";
import { Button, ButtonStyle } from "../guis/Button";
import { hasLoadingCompleted } from "../components/LoadingState";
import { RouteId, routeTo } from "../Router";
import { Menu } from "../guis/Menu";

export default class MenuScene implements Scene {
  menu = new Menu();
  hasLoaded = false;
  constructor() {}
  start() {
    const appId = ReservedEntity.DEFAULT_PIXI_APP;
    const app = QC.getPixiApp(appId);
    app.stage.addChild(this.menu);
  }
  playGame = () => {
    const appId = ReservedEntity.DEFAULT_PIXI_APP;
    const app = QC.getPixiApp(appId);
    app.stage.removeChild(this.menu);
    routeTo(RouteId.GAME);
  };
  update = () => {
    if (
      hasLoadingCompleted(ReservedEntity.GUI_BUTTON_IMAGE) &&
      !this.hasLoaded
    ) {
      const { menu } = this;
      const texture = QC.getImage(ReservedEntity.GUI_BUTTON_IMAGE).texture!;
      const playButton = new Button(new ButtonStyle({ label: "play" }));
      const optionsButton = new Button(new ButtonStyle({ label: "options" }));

      playButton.onPress.connect(this.playGame);

      playButton.style.texture = texture;
      optionsButton.style.texture = texture;

      menu.addItem(playButton, optionsButton);
      this.hasLoaded = true;
    }
  };
  stop() {}
  services = [LoadingService];
}
