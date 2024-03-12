import {
  DEBUG,
  getDebugAlias,
  isProduction,
  setDebugAlias,
  setLateBindingDebugAlias
} from "./Debug";

export interface IObservable<T> {
  subscribe(observer: (value: T) => void): IObservableSubscription;
  next(value: T): void;
}

export interface IReadonlyObservableCollection<T> {
  [Symbol.iterator](): IterableIterator<T>;
  has(entity: T): boolean;
  onAdd(observer: (value: T) => void): IObservableSubscription;
  stream(observer: (value: T) => void): IObservableSubscription;
  onRemove(observer: (value: T) => void): IObservableSubscription;
  debug: boolean;
}

export interface IObservableCollection<T>
  extends IReadonlyObservableCollection<T> {
  add(entity: T): void;
  remove(entity: T): void;
  clear(): void;
  unobserve(): void;
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
    let time = 0;
    if (!isProduction()) {
      time = performance.now();
    }
    for (const observer of this.#observers) {
      observer(value);
    }
    if (!isProduction() && DEBUG.observables) {
      console.log(
        `Observable "${getDebugAlias(this) ?? "unknown"}" run in ${
          performance.now() - time
        }ms`
      );
    }
  }

  clear() {
    this.#observers.clear();
  }
}

// TODO(perf): expose a forEach method and use that in queries
export class ObservableCollection<T> implements IObservableCollection<T> {
  #set = new Set<T>();
  #addObs = new Observable<T>();
  #removeObs = new Observable<T>();

  debug = false;

  constructor(collection: Iterable<T> = []) {
    if (!isProduction()) {
      setLateBindingDebugAlias(
        this.#addObs,
        () => `${getDebugAlias(this)}.addObs`
      );
      setDebugAlias(this.#removeObs, `${getDebugAlias(this)}.removeObs`);
    }
    for (const entity of collection) {
      this.#set.add(entity);
    }
  }

  [Symbol.iterator]() {
    return this.#set.values();
  }

  add(entity: T) {
    if (this.debug) {
      console.log(`${getDebugAlias(this)}.add`, entity);
    }
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

  clear() {
    this.#set.clear();
  }

  unobserve() {
    this.#addObs.clear();
    this.#removeObs.clear();
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

  stream(observer: (value: T) => void) {
    return super.onRemove(observer);
  }

  onAdd(observer: (value: T) => void) {
    return super.onRemove(observer);
  }

  onRemove(observer: (value: T) => void) {
    return super.stream(observer);
  }
}
