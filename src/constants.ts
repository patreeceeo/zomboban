import { EntityName } from "./Entity";

export const NAMED_ENTITY_IMAGES: Partial<Record<EntityName, string>> = {
  [EntityName.FLOOR_IMAGE]: "assets/images/floor.gif",
  [EntityName.WALL_IMAGE]: "assets/images/wall.gif",
  [EntityName.CRATE_IMAGE]: "assets/images/crate.gif",
  [EntityName.PLAYER_DOWN_IMAGE]: "assets/images/player_down.gif",
  [EntityName.ZOMBIE_DOWN_IMAGE]: "assets/images/zombie_down.gif",
  [EntityName.EDITOR_NORMAL_CURSOR_IMAGE]: "assets/images/normal_cursor.gif",
  [EntityName.EDITOR_REPLACE_CURSOR_IMAGE]: "assets/images/replace_cursor.gif",
  [EntityName.EDITOR_ORIENT_CURSOR_IMAGE]: "assets/images/orient_cursor.gif",
};

export const COMPONENT_DATA_URL = "/api/component_data/default";
