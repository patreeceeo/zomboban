import { Entity } from "./Entity";
import { IEntityFactory, IWorld } from "./EntityManager";

export interface IEntityPrefab<W extends IWorld, T extends Entity = Entity> {
  create: IEntityFactory<W, T>;
  destroy: (entity: T) => T;
}

// TODO move this enum to src/entities/index
export enum EntityPrefabEnum {
  Block,
  Monster,
  Player,
  Terminal,
  ToggleButton,
  ToggleWall,
  Wall,
  Grass
}

export interface IEntityPrefabState {
  entityPrefabMap: Map<EntityPrefabEnum, IEntityPrefab<any, any>>;
}
