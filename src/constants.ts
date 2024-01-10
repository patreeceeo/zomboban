import { EntityName } from "./Entity";
import { AnimationSource } from "./components/Animation";
import { Key, KeyMap } from "./Input";

export const NAMED_ENTITY_IMAGES: Partial<Record<EntityName, string>> = {
  [EntityName.FLOOR_IMAGE]: "assets/images/floor.gif",
  [EntityName.WALL_IMAGE]: "assets/images/wall.gif",
  [EntityName.CRATE_IMAGE]: "assets/images/crate.gif",
  [EntityName.PLAYER_DOWN_IMAGE]: "assets/images/player_down.gif",
  [EntityName.EDITOR_NORMAL_CURSOR_IMAGE]: "assets/images/normal_cursor.gif",
  [EntityName.EDITOR_REPLACE_CURSOR_IMAGE]: "assets/images/replace_cursor.gif",
  [EntityName.EDITOR_ORIENT_CURSOR_IMAGE]: "assets/images/orient_cursor.gif",
};

export const NAMED_ENTITY_ANIMATIONS: Partial<
  Record<EntityName, AnimationSource>
> = {
  [EntityName.ZOMBIE_SWAY_ANIMATION]: {
    from: "assets/images/zombie.json",
    key: "sway",
  },
  [EntityName.POTION_SPIN_ANIMATION]: {
    from: "assets/images/potion.json",
    key: "spin",
  },
};

export const COMPONENT_DATA_URL = "/api/component_data/default";

export const ZOMBIES_KEEP_MOVING = true;

export const MOVEMENT_KEY_MAPS = {
  [Key.a]: [-1, 0],
  [Key.s]: [0, 1],
  [Key.w]: [0, -1],
  [Key.d]: [1, 0],
} as KeyMap<[Txps, Typs]>;

export const INITIAL_INPUT_THROTTLE = 300;
export const REPEAT_INPUT_THROTTLE = 50;
