import {EntityName} from "./Entity";

export const NAMED_ENTITY_IMAGES: Partial<Record<EntityName, string>> = {
  [EntityName.FLOOR_IMAGE]: "assets/images/floor.gif",
  [EntityName.WALL_IMAGE]: "assets/images/wall.gif",
  [EntityName.CRATE_IMAGE]: "assets/images/crate.gif",
  [EntityName.PLAYER_DOWN_IMAGE]: "assets/images/player_down.gif",
  [EntityName.EDITOR_NORMAL_CURSOR_IMAGE]: "assets/images/normal_cursor.gif",
  [EntityName.EDITOR_REPLACE_CURSOR_IMAGE]: "assets/images/replace_cursor.gif",
}