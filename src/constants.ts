import { Key, KeyMap, combineKeys } from "./Input";
import { IEntityPrefab } from "./EntityManager";
import { PlayerEntity } from "./entities/PlayerPrefab";
import { BlockEntity } from "./entities/BlockEntity";
import { Vector2 } from "three";
import { MonsterEntity } from "./entities/MonsterEntity";
import { HeadingDirectionValue } from "./HeadingDirection";
import { RoosterEntity } from "./entities/RoosterEntity";
import { WallEntity } from "./entities/WallEntity";
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
  TransformComponent
} from "./components";

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
  block: `${MODEL_PATH}/block.glb`,
  wall: `${MODEL_PATH}/wall.glb`,
  monster: `${MODEL_PATH}/monster.glb`,
  rooster: `${MODEL_PATH}/rooster.glb`
};

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
    [Key.p]: PlayerEntity,
    [Key.b]: BlockEntity,
    [Key.m]: MonsterEntity,
    [Key.f]: RoosterEntity,
    [Key.e]: WallEntity
  } as KeyMap<IEntityPrefab<any, any>>,
  UNDO: Key.z,
  RESTART: combineKeys(Key.Shift, Key.r),
  SAVE: combineKeys(Key.Shift, Key.p)
};

export const INITIAL_INPUT_THROTTLE = 300;
export const REPEAT_INPUT_THROTTLE = 50;

export const BLOCK_WIDTH = 64;
export const BLOCK_HEIGHT = 64;

export const SESSION_COOKIE_NAME = "session";
export const MAX_SESSION_DURATION = 60 * 60 * 24; // 1 day

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
  AddedTag
];
