import { GameScene } from "./scenes/GameScene";
import { EditorScene } from "./scenes/EditorScene";
import { Scene } from "./Scene";

export const EDITOR_SCENE = new EditorScene();
export const GAME_SCENE = new GameScene();

export const SCENE_LIST: Array<Scene> = [EDITOR_SCENE, GAME_SCENE];
