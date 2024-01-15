import { Scene } from "../Scene";
import { LoadingService } from "../services/LoadingService";
import { CameraSystem } from "../systems/CameraSystem";
import { EditorSystem, stopEditorSystem } from "../systems/EditorSystem";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import { RenderSystem } from "../systems/RenderSystem";
import { SwitchSceneSystem } from "../systems/SwitchSceneSystem";

export class EditorScene implements Scene {
  start() {}
  update() {
    EditorSystem();
    CameraSystem();
    RenderSystem();
    EntityOperationSystem();
    SwitchSceneSystem();
  }
  stop() {
    stopEditorSystem();
  }
  services = [LoadingService];
}
