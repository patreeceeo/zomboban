import { Scene } from "../Scene";
import { LoadingService } from "../services/LoadingService";
import { CameraSystem, initCameraSystem } from "../systems/CameraSystem";
import {
  EditorSystem,
  startEditorSystem,
  stopEditorSystem,
} from "../systems/EditorSystem";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import { GlobalHotkeySystem } from "../systems/GlobalHotkeySystem";
import { LogService } from "../services/LogService";
import { DebugService } from "../services/DebugService";
import { RenderSystem } from "../systems/RenderSystem";

export default class EditorScene implements Scene {
  start() {
    initCameraSystem();
    startEditorSystem();
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
  }
  services = [LoadingService, DebugService, LogService];
}
