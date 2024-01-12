import { SceneManager } from "./Scene";

export const SCENE_MANAGER = new SceneManager();

export enum SceneId {
  EDITOR_SCENE,
  GAME_SCENE,
  GAME_OVER_SCENE,
}

export enum SharedEntity {
  GAME_OVER_TEXT,
  KILLER,
}
