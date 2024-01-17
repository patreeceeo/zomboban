import { ButtonContainer } from "@pixi/ui";
import { Scene } from "../Scene";
import { ReservedEntity } from "../entities";
import { LoadingService } from "../services/LoadingService";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { QC } from "../components";
import { PixiButton } from "../PixiButton";
import { Container } from "pixi.js";
import { hasLoadingCompleted } from "../components/LoadingState";
import { SCENE_MANAGER, SceneId } from "../scenes";

export default class MenuScene implements Scene {
  button: PixiButton;
  container: Container;
  constructor() {
    const appId = ReservedEntity.DEFAULT_PIXI_APP;
    const app = QC.getPixiApp(appId);

    const button = (this.button = new PixiButton({ label: "start" }));
    button.x = SCREENX_PX / 2;
    button.y = SCREENY_PX / 2;
    const container = (this.container = new ButtonContainer(button));
    app.stage.addChild(container);
    container.visible = false;
    container.onPress.connect(this.startGame);
  }
  start() {
    this.container.visible = true;
  }
  startGame = () => {
    this.container.parent!.removeChild(this.container);
    SCENE_MANAGER.start(SceneId.GAME);
  };
  update = () => {
    if (hasLoadingCompleted(ReservedEntity.GREEN_BUTTON_IMAGE)) {
      const texture = QC.getImage(ReservedEntity.GREEN_BUTTON_IMAGE).texture!;
      this.button.texture = texture;
    }
  };
  stop() {}
  services = [LoadingService];
}
