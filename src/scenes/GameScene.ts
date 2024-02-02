import { loadComponents } from "../Component";
import { Scene } from "../Scene";
import { COMPONENT_DATA_URL } from "../constants";
import { initializeTileMatrix } from "../functions/initializeTileMatrix";
import { LoadingService } from "../services/LoadingService";
import { ActionSystem } from "../systems/ActionSystem";
import { BehaviorSystem } from "../systems/BehaviorSystem";
import { CameraSystem } from "../systems/CameraSystem";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import { RenderSystem, startRenderSystem } from "../systems/RenderSystem";
import { GlobalHotkeySystem } from "../systems/GlobalHotkeySystem";
import { initCameraSystem } from "../systems/CameraSystem";
import { LogService } from "../services/LogService";
import { DebugService } from "../services/DebugService";

export default class GameScene implements Scene {
  start() {
    loadComponents(COMPONENT_DATA_URL);
    initializeTileMatrix();
    initCameraSystem();
    startRenderSystem();
  }
  update(deltaTime: number, elapsedTime: number) {
    BehaviorSystem(deltaTime, elapsedTime);
    ActionSystem(deltaTime, elapsedTime);
    CameraSystem();
    RenderSystem();
    EntityOperationSystem();
    GlobalHotkeySystem();
  }
  stop() {}
  services = [LoadingService, DebugService, LogService];
}
