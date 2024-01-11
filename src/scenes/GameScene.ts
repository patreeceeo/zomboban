import { Scene } from "../Scene";
import { initializeTileMatrix } from "../functions/initializeTileMatrix";
import { ActionSystem } from "../systems/ActionSystem";
import { BehaviorSystem } from "../systems/BehaviorSystem";
import { CameraSystem } from "../systems/CameraSystem";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import { LoadingSystem } from "../systems/LoadingSystem";
import { RenderSystem } from "../systems/RenderSystem";
import { SwitchSceneSystem } from "../systems/SwitchSceneSystem";

export class GameScene implements Scene {
  start() {
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
  services = [
    {
      update: LoadingSystem,
      interval: 100,
    },
  ];
}
