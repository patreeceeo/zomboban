import { IObservableCollection, ObservableCollection } from "./Observable";

export interface IEntity {}

export interface IEntityFactory<W extends IWorld, E extends IEntity> {
  (world: W): E;
}

export interface IEntityPrefab<W extends IWorld, T extends IEntity> {
  create: IEntityFactory<W, T>;
  destroy: (entity: T) => T;
}

export interface IWorld {
  entities: IObservableCollection<IEntity>;
  addEntity<
    Entity extends IEntity,
    Factory extends IEntityFactory<this, Entity>
  >(
    Factory?: Factory
  ): ReturnType<Factory>;
  removeEntity(entity: IEntity): void;
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
