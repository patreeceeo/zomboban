import { GameScene } from "./scenes/GameScene";
import { EditorScene } from "./scenes/EditorScene";
import { Scene, SceneManager } from "./Scene";
import { GameOverScene } from "./scenes/GameOverScene";

export const SCENE_MANAGER = new SceneManager();

export const EDITOR_SCENE = new EditorScene();
export const GAME_SCENE = new GameScene();
export const GAME_OVER_SCENE = new GameOverScene();

export const SCENE_LIST: Array<Scene> = [EDITOR_SCENE, GAME_SCENE];
