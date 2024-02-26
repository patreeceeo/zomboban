import { AnimationSource } from "./components/Animation";
import { ReservedEntity } from "./entities";
import { Key, KeyMap } from "./Input";
import {
  SpriteComponent,
  PositionComponent,
  TextureIdComponent,
  WorldIdComponent,
  GuidComponent,
  ShouldSaveComponent,
  LayerIdComponent,
  BehaviorComponent,
} from "./components";

// Make sure these are in dependency order?
export const SERVER_COMPONENTS = [
  SpriteComponent,
  PositionComponent,
  BehaviorComponent,
  LayerIdComponent,
  TextureIdComponent,
  WorldIdComponent,
  ShouldSaveComponent,
  GuidComponent,
];

export const IMAGES: ReadonlyArray<readonly [number, string]> = [
  [ReservedEntity.FLOOR_IMAGE, "assets/images/floor.gif"],
  [ReservedEntity.WALL_IMAGE, "assets/images/wall.gif"],
  [ReservedEntity.CRATE_IMAGE, "assets/images/crate.gif"],
  [ReservedEntity.PLAYER_DOWN_IMAGE, "assets/images/player_down.gif"],
  [
    ReservedEntity.EDITOR_NORMAL_CURSOR_IMAGE,
    "assets/images/normal_cursor.gif",
  ],
  [
    ReservedEntity.EDITOR_REPLACE_CURSOR_IMAGE,
    "assets/images/replace_cursor.gif",
  ],
  [
    ReservedEntity.EDITOR_ORIENT_CURSOR_IMAGE,
    "assets/images/orient_cursor.gif",
  ],
  [ReservedEntity.GUI_BUTTON_IMAGE, "assets/images/gui_green_button.gif"],
  [ReservedEntity.HAND_CURSOR_IMAGE, "assets/images/hand.gif"],
];

export const ANIMATIONS: Readonly<readonly [number, AnimationSource]>[] = [
  [
    ReservedEntity.ZOMBIE_SWAY_ANIMATION,
    {
      from: "assets/images/zombie.json",
      key: "sway",
    },
  ],
  [
    ReservedEntity.POTION_SPIN_ANIMATION,
    {
      from: "assets/images/potion.json",
      key: "spin",
    },
  ],
];

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
    [Key.l]: [1, 0],
  } as KeyMap<[TilesX, TilesY]>,
};

export const INITIAL_INPUT_THROTTLE = 300;
export const REPEAT_INPUT_THROTTLE = 50;

export const HAND_CURSOR_STYLE = "url(assets/images/hand.gif) 7 3, auto";
export const HAND_TAP_CURSOR_STYLE =
  "url(assets/images/hand_tap.gif) 7 3, auto";

export const SPRITE_WIDTH = 64;
export const SPRITE_HEIGHT = 92;
