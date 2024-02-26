import { Scene } from "../Scene";
import { initializeTileMatrix } from "../functions/initializeTileMatrix";
import { LoadingService } from "../services/LoadingService";
import { ActionSystem } from "../systems/ActionSystem";
import { BehaviorSystem } from "../systems/BehaviorSystem";
import { CameraSystem } from "../systems/CameraSystem";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import { GlobalHotkeySystem } from "../systems/GlobalHotkeySystem";
import { initCameraSystem } from "../systems/CameraSystem";
import { LogService } from "../services/LogService";
import { DebugService } from "../services/DebugService";
import { Object3DSystem } from "../systems/Object3DSystem";

export default class GameScene implements Scene {
  start() {
    initializeTileMatrix();
    initCameraSystem();
  }
  update(deltaTime: number, elapsedTime: number) {
    BehaviorSystem(deltaTime, elapsedTime);
    ActionSystem(deltaTime, elapsedTime);
    CameraSystem();
    Object3DSystem();
    EntityOperationSystem();
    GlobalHotkeySystem();
  }
  stop() {}
  services = [LoadingService, DebugService, LogService];
}
