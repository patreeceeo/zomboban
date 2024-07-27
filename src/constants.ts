import { Key, KeyMap, combineKeys } from "./Input";
import { Vector2 } from "three";
import { HeadingDirectionValue } from "./HeadingDirection";
import {
  AddedTag,
  AnimationComponent,
  BehaviorComponent,
  HeadingDirectionComponent,
  IsActiveTag,
  IsGameEntityTag,
  ModelComponent,
  ServerIdComponent,
  TilePositionComponent,
  ToggleableComponent,
  TransformComponent
} from "./components";
import { PrefabEntity } from "./entities";

export const BASE_URL = import.meta.env
  ? import.meta.env.BASE_URL
  : process.env.BASE_URL ?? "";

export const VIEWPORT_SIZE = new Vector2(1024, 1024);

export const KEY_MAPS = {
  TOGGLE_MENU: Key.Escape,
  TOGGLE_EDITOR: Key.Space,
  MOVE: {
    [Key.a]: HeadingDirectionValue.Left,
    [Key.s]: HeadingDirectionValue.Down,
    [Key.w]: HeadingDirectionValue.Up,
    [Key.d]: HeadingDirectionValue.Right,
    [Key.j]: HeadingDirectionValue.Down,
    [Key.k]: HeadingDirectionValue.Up,
    [Key.h]: HeadingDirectionValue.Left,
    [Key.l]: HeadingDirectionValue.Right
  } as KeyMap<HeadingDirectionValue>,
  CREATE_PREFEB: {
    [Key.p]: PrefabEntity.Player,
    [Key.b]: PrefabEntity.Block,
    [Key.m]: PrefabEntity.Monster,
    [Key.e]: PrefabEntity.Wall,
    [Key.t]: PrefabEntity.ToggleButton,
    [Key.f]: PrefabEntity.ToggleWall,
    [Key.u]: PrefabEntity.Rooster
  } as KeyMap<PrefabEntity>,
  UNDO: Key.z,
  RESTART: combineKeys(Key.Shift, Key.r),
  SAVE: combineKeys(Key.Shift, Key.p),
  SHOW_DEV_TOOLS: combineKeys(Key.Control, Key.Shift, Key.y)
};

export const BLOCK_HEIGHT = 64;

export const SESSION_COOKIE_NAME = "session";
export const MAX_SESSION_DURATION = 1000 * 60 * 60 * 24; // 1 day

export const NETWORK_COMPONENTS = [
  ServerIdComponent,
  TransformComponent,
  TilePositionComponent,
  AnimationComponent,
  ModelComponent,
  BehaviorComponent,
  HeadingDirectionComponent,
  IsActiveTag,
  IsGameEntityTag,
  AddedTag,
  ToggleableComponent
];
