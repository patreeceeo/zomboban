import { ObservableCollection } from "./Observable";

export interface IEntity {}

export interface IEntityFactory<T extends IEntity> {
  (): T;
}

export interface IEntityPrefab<T extends IEntity> {
  create: IEntityFactory<T>;
  destroy: (entity: T) => T;
}

export class World {
  #entities = new ObservableCollection<IEntity>();

  get entities() {
    return this.#entities;
  }

  addEntity<Entity extends IEntity, Factory extends () => Entity>(
    Factory?: Factory
  ): ReturnType<Factory> {
    const entity = Factory ? Factory() : {};
    this.#entities.add(entity);
    return entity as ReturnType<Factory>;
  }

  removeEntity(entity: IEntity) {
    this.#entities.remove(entity);
  }
}
