import { ObservableCollection } from "./Observable";

export interface IEntity {}

export interface IEntityFactory<W extends World, E extends IEntity> {
  (world: W): E;
}

export interface IEntityPrefab<W extends World, T extends IEntity> {
  create: IEntityFactory<W, T>;
  destroy: (entity: T) => T;
}

export class World {
  #entities = new ObservableCollection<IEntity>();

  get entities() {
    return this.#entities;
  }

  addEntity<
    Entity extends IEntity,
    Factory extends IEntityFactory<this, Entity>
  >(Factory?: Factory): ReturnType<Factory> {
    const entity = Factory ? Factory(this) : {};
    this.#entities.add(entity);
    return entity as ReturnType<Factory>;
  }

  removeEntity(entity: IEntity) {
    this.#entities.remove(entity);
  }
}
