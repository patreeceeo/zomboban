import { loadComponents } from "../Component";
import { Scene } from "../Scene";
import { COMPONENT_DATA_URL } from "../constants";
import { LoadingService } from "../services/LoadingService";
import { CameraSystem } from "../systems/CameraSystem";
import { EditorSystem, stopEditorSystem } from "../systems/EditorSystem";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import { RenderSystem } from "../systems/RenderSystem";
import { SwitchSceneSystem } from "../systems/SwitchSceneSystem";
import "../components";

export default class EditorScene implements Scene {
  start() {
    loadComponents(COMPONENT_DATA_URL);
  }
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
