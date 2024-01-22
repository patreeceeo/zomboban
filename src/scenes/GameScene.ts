import { loadComponents } from "../Component";
import { Scene } from "../Scene";
import { COMPONENT_DATA_URL } from "../constants";
import { initializeTileMatrix } from "../functions/initializeTileMatrix";
import { LoadingService } from "../services/LoadingService";
import { ActionSystem } from "../systems/ActionSystem";
import { BehaviorSystem } from "../systems/BehaviorSystem";
import { CameraSystem } from "../systems/CameraSystem";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import {
  RenderSystem,
  startRenderSystem,
  stopRenderSystem,
} from "../systems/RenderSystem";
import { GlobalHotkeySystem } from "../systems/GlobalHotkeySystem";
import { initCameraSystem } from "../systems/CameraSystem";
import { getPixiApp } from "../components/PixiApp";
import { ReservedEntity } from "../entities";

export default class GameScene implements Scene {
  start() {
    loadComponents(COMPONENT_DATA_URL);
    initializeTileMatrix();
    initCameraSystem();
    const app = getPixiApp(ReservedEntity.DEFAULT_PIXI_APP);
    startRenderSystem(app);
  }
  update(deltaTime: number, elapsedTime: number) {
    BehaviorSystem(deltaTime, elapsedTime);
    ActionSystem(deltaTime, elapsedTime);
    CameraSystem();
    RenderSystem();
    EntityOperationSystem();
    GlobalHotkeySystem();
  }
  stop() {
    const app = getPixiApp(ReservedEntity.DEFAULT_PIXI_APP);
    stopRenderSystem(app);
  }
  services = [LoadingService];
}
