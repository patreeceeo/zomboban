export interface IReadonlyObservableCollection<T> {
  [Symbol.iterator](): IterableIterator<T>;
  has(entity: T): boolean;
  onAdd(observer: (value: T) => void): void;
  stream(observer: (value: T) => void): void;
  onRemove(observer: (value: T) => void): void;
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

export class ObserableCollection<T>
  implements IReadonlyObservableCollection<T>
{
  #set = new Set<T>();
  #addObs = new Observable<T>();
  #removeObs = new Observable<T>();

  constructor(collection: Iterable<T> = []) {
    for (const entity of collection) {
      this.#set.add(entity);
    }
  }

  [Symbol.iterator]() {
    return this.#set.values();
  }

  add(entity: T) {
    this.#set.add(entity);
    this.#addObs.next(entity);
  }

  has(entity: T) {
    return this.#set.has(entity);
  }

  remove(entity: T) {
    this.#set.delete(entity);
    this.#removeObs.next(entity);
  }

  onAdd(observer: (value: T) => void) {
    this.#addObs.subscribe(observer);
  }

  stream(observer: (value: T) => void) {
    for (const entity of this.#set) {
      observer(entity);
    }
    this.#addObs.subscribe(observer);
  }

  onRemove(observer: (value: T) => void) {
    this.#removeObs.subscribe(observer);
  }
}

export class InverseObservalbeCollection<T> extends ObserableCollection<T> {
  constructor(collection: Iterable<T>) {
    super(collection);
  }

  add(entity: T) {
    super.remove(entity);
  }

  remove(entity: T) {
    super.add(entity);
  }
}
