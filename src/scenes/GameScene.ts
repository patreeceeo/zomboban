import { loadComponents } from "../Component";
import { Scene } from "../Scene";
import { COMPONENT_DATA_URL } from "../constants";
import { initializeTileMatrix } from "../functions/initializeTileMatrix";
import { LoadingService } from "../services/LoadingService";
import { ActionSystem } from "../systems/ActionSystem";
import { BehaviorSystem } from "../systems/BehaviorSystem";
import { CameraSystem } from "../systems/CameraSystem";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import { RenderSystem } from "../systems/RenderSystem";
import { SwitchSceneSystem } from "../systems/SwitchSceneSystem";
import "../components";

export default class GameScene implements Scene {
  start() {
    loadComponents(COMPONENT_DATA_URL);
    initializeTileMatrix();
  }
  update(deltaTime: number, elapsedTime: number) {
    BehaviorSystem(deltaTime, elapsedTime);
    ActionSystem(deltaTime, elapsedTime);
    CameraSystem();
    RenderSystem();
    EntityOperationSystem();
    SwitchSceneSystem();
  }
  stop() {}
  services = [LoadingService];
}
