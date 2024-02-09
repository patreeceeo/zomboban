import { Scene } from "../Scene";
import { LoadingService } from "../services/LoadingService";
import { CameraSystem, initCameraSystem } from "../systems/CameraSystem";
import { EditorSystem, stopEditorSystem } from "../systems/EditorSystem";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import {
  RenderSystem,
  startRenderSystem,
  stopRenderSystem,
} from "../systems/RenderSystem";
import { GlobalHotkeySystem } from "../systems/GlobalHotkeySystem";
import { LogService } from "../services/LogService";
import { DebugService } from "../services/DebugService";

export default class EditorScene implements Scene {
  start() {
    initCameraSystem();
    startRenderSystem();
  }
  update() {
    EditorSystem();
    CameraSystem();
    RenderSystem();
    EntityOperationSystem();
    GlobalHotkeySystem();
  }
  stop() {
    stopEditorSystem();
    stopRenderSystem();
  }
  services = [LoadingService, DebugService, LogService];
}
