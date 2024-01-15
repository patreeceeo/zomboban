import { SceneManager } from "./Scene";
import { awaitDefaultExport } from "./util";

export const SCENE_MANAGER = new SceneManager();

export enum SceneId {
  MAIN_MENU,
  EDITOR,
  GAME,
  GAME_OVER,
}

export enum SharedEntity {
  GAME_OVER_TEXT,
  KILLER,
}

SCENE_MANAGER.registerScene(
  awaitDefaultExport(import("./scenes/MenuScene")),
  SceneId.MAIN_MENU,
);
SCENE_MANAGER.registerScene(
  awaitDefaultExport(import("./scenes/EditorScene")),
  SceneId.EDITOR,
);
SCENE_MANAGER.registerScene(
  awaitDefaultExport(import("./scenes/GameScene")),
  SceneId.GAME,
);
SCENE_MANAGER.registerScene(
  awaitDefaultExport(import("./scenes/GameOverScene")),
  SceneId.GAME_OVER,
);
