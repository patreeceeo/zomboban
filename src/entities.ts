import { registerEntity } from "./Entity";

// TODO try to reduce the number of reserved entities
export enum ReservedEntity {
  DEFAULT_PIXI_APP,
  CAMERA,
  FLOOR_IMAGE,
  WALL_IMAGE,
  CRATE_IMAGE,
  PLAYER_DOWN_IMAGE,
  ZOMBIE_SWAY_ANIMATION,
  POTION_SPIN_ANIMATION,
  EDITOR_NORMAL_CURSOR_IMAGE,
  EDITOR_REPLACE_CURSOR_IMAGE,
  EDITOR_ORIENT_CURSOR_IMAGE,
  SCORE_TEXT,
}

const reservedEntities = [
  ReservedEntity.DEFAULT_PIXI_APP,
  ReservedEntity.CAMERA,
  ReservedEntity.FLOOR_IMAGE,
  ReservedEntity.WALL_IMAGE,
  ReservedEntity.CRATE_IMAGE,
  ReservedEntity.PLAYER_DOWN_IMAGE,
  ReservedEntity.ZOMBIE_SWAY_ANIMATION,
  ReservedEntity.POTION_SPIN_ANIMATION,
  ReservedEntity.EDITOR_NORMAL_CURSOR_IMAGE,
  ReservedEntity.EDITOR_REPLACE_CURSOR_IMAGE,
  ReservedEntity.EDITOR_ORIENT_CURSOR_IMAGE,
  ReservedEntity.SCORE_TEXT,
];

export function reserveEntities() {
  reservedEntities.forEach(registerEntity);
}
