import { Scene } from "../Scene";
import { ReservedEntity } from "../entities";
import { LoadingService } from "../services/LoadingService";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { QC } from "../components";
import { Button, ButtonStyle } from "../guis/Button";
import { hasLoadingCompleted } from "../components/LoadingState";
import { RouteId, routeTo } from "../Router";

export default class MenuScene implements Scene {
  button: Button;
  constructor() {
    const button = (this.button = new Button(
      new ButtonStyle({ label: "play" }),
    ));
    button.x = SCREENX_PX / 2;
    button.y = SCREENY_PX / 2;
    button.onPress.connect(this.playGame);
  }
  start() {
    const appId = ReservedEntity.DEFAULT_PIXI_APP;
    const app = QC.getPixiApp(appId);
    app.stage.addChild(this.button);
    this.button.visible = true;
  }
  playGame = () => {
    const appId = ReservedEntity.DEFAULT_PIXI_APP;
    const app = QC.getPixiApp(appId);
    app.stage.removeChild(this.button);
    routeTo(RouteId.GAME);
  };
  update = () => {
    if (hasLoadingCompleted(ReservedEntity.GUI_BUTTON_IMAGE)) {
      const texture = QC.getImage(ReservedEntity.GUI_BUTTON_IMAGE).texture!;
      this.button.style.texture = texture;
    }
  };
  stop() {}
  services = [LoadingService];
}
