import { Scene } from "../Scene";
import { CameraSystem } from "../systems/CameraSystem";
import { initCameraSystem } from "../systems/CameraSystem";
import { RenderSystem } from "../systems/RenderSystem";
// import { initializeTileMatrix } from "../functions/initializeTileMatrix";
// import { LoadingService } from "../services/LoadingService";
// import { LogService } from "../services/LogService";
// import { DebugService } from "../services/DebugService";

export default class GameScene implements Scene {
  start() {
    initCameraSystem();
  }
  update(deltaTime: number, elapsedTime: number) {
    void deltaTime;
    void elapsedTime;
    CameraSystem();
    RenderSystem();
  }
  stop() {}
  services = [];
}
