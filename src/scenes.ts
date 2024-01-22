import { SceneManager } from "./Scene";
import { awaitDefaultExport } from "./util";

export const SCENE_MANAGER = new SceneManager();

export enum SceneId {
  MENU,
  EDITOR,
  GAME,
}

export enum SharedEntity {
  KILLER,
}

SCENE_MANAGER.registerScene(
  awaitDefaultExport(import("./scenes/MenuScene")),
  SceneId.MENU,
);
SCENE_MANAGER.registerScene(
  awaitDefaultExport(import("./scenes/EditorScene")),
  SceneId.EDITOR,
);
SCENE_MANAGER.registerScene(
  awaitDefaultExport(import("./scenes/GameScene")),
  SceneId.GAME,
);
