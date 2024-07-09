import { IEntityPrefab } from "../EntityManager";

export enum PrefabEntity {
  Block,
  Monster,
  Player,
  Rooster,
  ToggleButton,
  ToggleWall,
  Wall
}

export const PREFAB_ENTITY_REG = new Map<PrefabEntity, IEntityPrefab<any>>();
