import { ButtonContainer } from "@pixi/ui";
import { addEntity } from "../Entity";
import { Scene } from "../Scene";
import { ReservedEntity } from "../entities";
import { LoadingService } from "../services/LoadingService";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import { RenderSystem } from "../systems/RenderSystem";
import { SwitchSceneSystem } from "../systems/SwitchSceneSystem";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import "../components";
import { PixiButton } from "../PixiButton";
import { setLookLike } from "../components/LookLike";

export default class MenuScene implements Scene {
  buttonId: number;
  constructor() {
    this.buttonId = addEntity((id) => {
      const defaultPixiAppId = ReservedEntity.DEFAULT_PIXI_APP;
      setPixiAppId(id, defaultPixiAppId);
      setPosition(id, (SCREENX_PX / 2) as Px, (SCREENY_PX / 2) as Px);
      setIsVisible(id, false);
      setLookLike(id, ReservedEntity.GREEN_BUTTON_IMAGE);

      const buttonSprite = new PixiButton({ label: "start" });
      setSprite(id, buttonSprite);
      const container = new ButtonContainer();
      setDisplayContainer(id, container);
    });
  }
  start() {
    setIsVisible(this.buttonId, true);
  }
  update = () => {
    RenderSystem();
    EntityOperationSystem();
    SwitchSceneSystem();
  };
  stop() {}
  services = [LoadingService];
}
