import { Entity } from "./Entity";
import { IEntityFactory, IWorld } from "./EntityManager";

export interface IEntityPrefab<W extends IWorld, T extends Entity = Entity> {
  // TODO should the prefab create method actually add the entity?
  // TODO need a way to pass parameters like the initial position?
  create: IEntityFactory<W, T>;
  destroy: (entity: T) => T;
  isPlatform: boolean;
}
