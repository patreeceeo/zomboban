export interface IEntity {
  readonly name: string;
}

export interface IEntityFactory<T extends IEntity, Data extends IEntity> {
  create(data?: Data): T;
  isInstance(entity: IEntity): entity is T;
}

class Observable<T> {
  #observers: ((value: T) => void)[] = [];

  subscribe(observer: (value: T) => void) {
    this.#observers.push(observer);
  }

  next(value: T) {
    for (const observer of this.#observers) {
      observer(value);
    }
  }
}

export class EntityCollection<T> {
  #entities = new Set<T>();
  #addObs = new Observable<T>();
  #removeObs = new Observable<T>();

  [Symbol.iterator]() {
    return this.#entities.values();
  }

  add(entity: T) {
    this.#entities.add(entity);
    this.#addObs.next(entity);
  }

  remove(entity: T) {
    this.#entities.delete(entity);
    this.#removeObs.next(entity);
  }

  onAdd(observer: (value: T) => void) {
    this.#addObs.subscribe(observer);
  }

  stream(observer: (value: T) => void) {
    for (const entity of this.#entities) {
      observer(entity);
    }
    this.#addObs.subscribe(observer);
  }

  onRemove(observer: (value: T) => void) {
    this.#removeObs.subscribe(observer);
  }
}

export interface IReadonlyEntityCollection<T> {
  [Symbol.iterator](): IterableIterator<T>;
  onAdd(observer: (value: T) => void): void;
  stream(observer: (value: T) => void): void;
  onRemove(observer: (value: T) => void): void;
}

export class World {
  #entities = new EntityCollection<IEntity>();

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
}
