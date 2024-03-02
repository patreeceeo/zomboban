export interface IReadonlyObservableCollection<T> {
  [Symbol.iterator](): IterableIterator<T>;
  has(entity: T): boolean;
  onAdd(observer: (value: T) => void): IObservableSubscription;
  stream(observer: (value: T) => void): IObservableSubscription;
  onRemove(observer: (value: T) => void): IObservableSubscription;
}

export interface IObservableSubscription {
  unsubscribe(): void;
}

export class Observable<T> {
  #observers = new Set<(value: T) => void>();

  subscribe(observer: (value: T) => void): IObservableSubscription {
    this.#observers.add(observer);
    return {
      unsubscribe: () => {
        this.#observers.delete(observer);
      }
    };
  }

  next(value: T) {
    for (const observer of this.#observers) {
      observer(value);
    }
  }
}

export class ObservableCollection<T>
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
    return this.#addObs.subscribe(observer);
  }

  stream(observer: (value: T) => void) {
    for (const entity of this.#set) {
      observer(entity);
    }
    return this.#addObs.subscribe(observer);
  }

  onRemove(observer: (value: T) => void) {
    return this.#removeObs.subscribe(observer);
  }
}

export class InverseObservalbeCollection<T> extends ObservableCollection<T> {
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
