import { loadComponents } from "../Component";
import { Scene } from "../Scene";
import { COMPONENT_DATA_URL } from "../constants";
import { LoadingService } from "../services/LoadingService";
import { CameraSystem, initCameraSystem } from "../systems/CameraSystem";
import { EditorSystem, stopEditorSystem } from "../systems/EditorSystem";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import {
  RenderSystem,
  startRenderSystem,
  stopRenderSystem,
} from "../systems/RenderSystem";
import { SwitchSceneSystem } from "../systems/SwitchSceneSystem";
import "../components";
import { getPixiApp } from "../components/PixiApp";
import { ReservedEntity } from "../entities";

export default class EditorScene implements Scene {
  start() {
    loadComponents(COMPONENT_DATA_URL);
    initCameraSystem();
    const app = getPixiApp(ReservedEntity.DEFAULT_PIXI_APP);
    startRenderSystem(app);
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
    const app = getPixiApp(ReservedEntity.DEFAULT_PIXI_APP);
    stopRenderSystem(app);
  }
  services = [LoadingService];
}
