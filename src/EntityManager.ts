import { ObserableCollection } from "./Observable";

export interface IEntity {}

export interface IEntityFactory<T extends IEntity> {
  (): T;
}

function defaultFactory() {
  return {};
}

export class World {
  #entities = new ObserableCollection<IEntity>();

  get entities() {
    return this.#entities;
  }

  addEntity<T extends IEntity = IEntity>(
    Factory = defaultFactory as IEntityFactory<T>,
  ) {
    const entity = Factory();
    this.#entities.add(entity);
    return entity;
  }

  removeEntity(entity: IEntity) {
    this.#entities.remove(entity);
  }
}
