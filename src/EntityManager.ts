import { ObserableCollection } from "./Observable";

export interface IEntity {
  readonly name: string;
}

export interface IEntityFactory<T extends IEntity, Data extends IEntity> {
  create(data?: Data): T;
  isInstance(entity: IEntity): entity is T;
}

export class World {
  #entities = new ObserableCollection<IEntity>();

  get entities() {
    return this.#entities;
  }

  addEntity<T extends IEntity, Data extends IEntity>(
    Factory: IEntityFactory<T, Data>,
    data?: Data,
  ) {
    const entity = Factory.create(data);
    this.#entities.add(entity);
    return entity;
  }

  removeEntity(entity: IEntity) {
    this.#entities.remove(entity);
  }
}
