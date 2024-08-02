import { IEntityPrefab } from "../EntityManager";

export enum PrefabEntity {
  Block,
  Monster,
  Player,
  Terminal,
  ToggleButton,
  ToggleWall,
  Wall
}

export interface IPrefabEntityState {
  prefabEntityMap: Map<PrefabEntity, IEntityPrefab<any, any>>;
}
