import { Key, KeyMap } from "./Input";
import { IEntityPrefab } from "./EntityManager";
import { PlayerEntity } from "./entities/PlayerPrefab";
import { BlockEntity } from "./entities/BlockEntity";

export const IMAGES = {
  floor: "assets/images/floor.gif",
  wall: "assets/images/wall.gif",
  crate: "assets/images/crate.gif",
  playerDown: "assets/images/player_down.gif",
  editorNormalCursor: "assets/images/normal_cursor.gif",
  editorReplaceCursor: "assets/images/replace_cursor.gif",
  editorOrientCursor: "assets/images/orient_cursor.gif",
  guiButton: "assets/images/gui_green_button.gif",
  handCursor: "assets/images/hand.gif"
};

export const COMPONENT_DATA_URL = "/api/component_data/default";

export const KEY_MAPS = {
  SHOW_MENU: Key.Escape,
  TOGGLE_EDITOR: Key.Space,
  MOVE: {
    [Key.a]: [-1, 0],
    [Key.s]: [0, -1],
    [Key.w]: [0, 1],
    [Key.d]: [1, 0],
    [Key.j]: [0, -1],
    [Key.k]: [0, 1],
    [Key.h]: [-1, 0],
    [Key.l]: [1, 0]
  } as KeyMap<[Tile, Tile]>,
  CREATE_PREFEB: {
    [Key.p]: PlayerEntity,
    [Key.b]: BlockEntity
  } as KeyMap<IEntityPrefab<any, any>>,
  UNDO: Key.z
};

export const INITIAL_INPUT_THROTTLE = 300;
export const REPEAT_INPUT_THROTTLE = 50;

export const HAND_CURSOR_STYLE = "url(assets/images/hand.gif) 7 3, auto";
export const HAND_TAP_CURSOR_STYLE =
  "url(assets/images/hand_tap.gif) 7 3, auto";

export const SPRITE_WIDTH = 64;
export const SPRITE_HEIGHT = 92;
