import { Scene } from "../Scene";
import { ReservedEntity } from "../entities";
import { LoadingService } from "../services/LoadingService";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { QC } from "../components";
import { Button, ButtonStyle } from "../guis/Button";
import { hasLoadingCompleted } from "../components/LoadingState";
import { SCENE_MANAGER, SceneId } from "../scenes";

export default class MenuScene implements Scene {
  button: Button;
  constructor() {
    const appId = ReservedEntity.DEFAULT_PIXI_APP;
    const app = QC.getPixiApp(appId);

    const button = (this.button = new Button(
      new ButtonStyle({ label: "play" }),
    ));
    button.x = SCREENX_PX / 2;
    button.y = SCREENY_PX / 2;
    button.visible = false;
    button.onPress.connect(this.playGame);
    app.stage.addChild(button);
  }
  start() {
    this.button.visible = true;
  }
  playGame = () => {
    const { button } = this;
    button.parent!.removeChild(button);
    SCENE_MANAGER.start(SceneId.GAME);
  };
  update = () => {
    if (hasLoadingCompleted(ReservedEntity.GREEN_BUTTON_IMAGE)) {
      const texture = QC.getImage(ReservedEntity.GREEN_BUTTON_IMAGE).texture!;
      this.button.style.texture = texture;
    }
  };
  stop() {}
  services = [LoadingService];
}
