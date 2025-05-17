import { Key, KeyMap, combineKeys } from "./Input";
import { Vector2 } from "./Three";
import { HeadingDirectionValue } from "./HeadingDirection";
import { EntityPrefabEnum } from "./entities";

export const BASE_URL = import.meta.env
  ? import.meta.env.BASE_URL
  : process.env.BASE_URL ?? "";

export const VIEWPORT_SIZE = new Vector2(1024, 1024);

export const KEY_MAPS = {
  TOGGLE_EDITOR: Key.Space,
  EDITOR_REPLACE_MODE: Key.r,
  EDITOR_NORMAL_MODE: Key.Escape,
  EDITOR_DELETE: Key.x,
  MOVE: {
    [Key.a]: HeadingDirectionValue.Left,
    [Key.s]: HeadingDirectionValue.Down,
    [Key.w]: HeadingDirectionValue.Up,
    [Key.d]: HeadingDirectionValue.Right,
    [Key.j]: HeadingDirectionValue.Down,
    [Key.k]: HeadingDirectionValue.Up,
    [Key.h]: HeadingDirectionValue.Left,
    [Key.l]: HeadingDirectionValue.Right,
    [Key.ArrowLeft]: HeadingDirectionValue.Left,
    [Key.ArrowDown]: HeadingDirectionValue.Down,
    [Key.ArrowUp]: HeadingDirectionValue.Up,
    [Key.ArrowRight]: HeadingDirectionValue.Right
  } as KeyMap<HeadingDirectionValue>,
  CREATE_PREFEB: {
    [Key.p]: EntityPrefabEnum.Player,
    [Key.b]: EntityPrefabEnum.Block,
    [Key.m]: EntityPrefabEnum.Monster,
    [Key.e]: EntityPrefabEnum.Wall,
    [Key.t]: EntityPrefabEnum.ToggleButton,
    [Key.f]: EntityPrefabEnum.ToggleWall,
    [Key.u]: EntityPrefabEnum.Terminal,
    [Key.g]: EntityPrefabEnum.Fire
  } as KeyMap<EntityPrefabEnum>,
  UNDO: Key.z,
  RESTART: combineKeys(Key.Shift, Key.r),
  SAVE: combineKeys(Key.Shift, Key.p),
  SHOW_DEV_TOOLS: combineKeys(Key.Control, Key.Shift, Key.y)
};

export const BLOCK_HEIGHT = 64;

export const SESSION_COOKIE_NAME = "session";
export const MAX_SESSION_DURATION = 1000 * 60 * 60 * 24; // 1 day
