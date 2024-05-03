import { Key, KeyMap, combineKeys } from "./Input";
import { IEntityPrefab } from "./EntityManager";
import { PlayerEntity } from "./entities/PlayerPrefab";
import { BlockEntity } from "./entities/BlockEntity";
import { Vector2 } from "three";
import { HeadingDirection } from "./components";

export const ENV = process.env.NODE_ENV as
  | "development"
  | "production"
  | "test";

export const BASE_URL = import.meta.env
  ? import.meta.env.BASE_URL
  : process.env.BASE_URL ?? "";

export const VIEWPORT_SIZE = new Vector2(1024, 1024);

export const IMAGE_PATH = "/assets/images";
export const MODEL_PATH = "/assets/models";
export const FONT_PATH = "/assets/fonts";

// TODO(migration): omit file extensions?
export const ASSETS = {
  editorNormalCursor: `${IMAGE_PATH}/normal_cursor.gif`,
  editorReplaceCursor: `${IMAGE_PATH}/replace_cursor.gif`,
  player: `${MODEL_PATH}/player.glb`,
  block: `${MODEL_PATH}/block.glb`
};

export const KEY_MAPS = {
  SHOW_MENU: Key.Escape,
  TOGGLE_EDITOR: Key.Space,
  MOVE: {
    [Key.a]: HeadingDirection.Left,
    [Key.s]: HeadingDirection.Down,
    [Key.w]: HeadingDirection.Up,
    [Key.d]: HeadingDirection.Right,
    [Key.j]: HeadingDirection.Down,
    [Key.k]: HeadingDirection.Up,
    [Key.h]: HeadingDirection.Left,
    [Key.l]: HeadingDirection.Right
  } as KeyMap<HeadingDirection>,
  CREATE_PREFEB: {
    [Key.p]: PlayerEntity,
    [Key.b]: BlockEntity
  } as KeyMap<IEntityPrefab<any, any>>,
  UNDO: Key.z,
  SAVE: combineKeys(Key.Shift, Key.p)
};

export const INITIAL_INPUT_THROTTLE = 300;
export const REPEAT_INPUT_THROTTLE = 50;

export const BLOCK_WIDTH = 64;
export const BLOCK_HEIGHT = 64;

export const SESSION_COOKIE_NAME = "session";
export const MAX_SESSION_DURATION = 60 * 60 * 24; // 1 day
