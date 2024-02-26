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
import { Object3DSystem } from "../systems/Object3DSystem";

export default class EditorScene implements Scene {
  start() {
    initCameraSystem();
    startEditorSystem();
  }
  update() {
    EditorSystem();
    CameraSystem();
    Object3DSystem();
    EntityOperationSystem();
    GlobalHotkeySystem();
  }
  stop() {
    stopEditorSystem();
  }
  services = [LoadingService, DebugService, LogService];
}
