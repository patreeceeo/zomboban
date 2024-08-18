import { Entity } from "./Entity";
import { IEntityFactory, IWorld } from "./EntityManager";

export interface IEntityPrefab<W extends IWorld, T extends Entity = Entity> {
  create: IEntityFactory<W, T>;
  destroy: (entity: T) => T;
}
