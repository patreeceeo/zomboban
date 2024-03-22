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

export interface IReadonlyObservableSet<T> {
  [Symbol.iterator](): IterableIterator<T>;
  has(entity: T): boolean;
  onAdd(observer: (value: T) => void): IObservableSubscription;
  stream(observer: (value: T) => void): IObservableSubscription;
  onRemove(observer: (value: T) => void): IObservableSubscription;
  debug: boolean;
}

export interface IObservableSet<T> extends IReadonlyObservableSet<T> {
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

// TODO(perf) rename this to ObservableSet and create an ObservableArray class so it can have an effecient at() method
export class ObservableSet<T> implements IObservableSet<T> {
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

  get size() {
    return this.#set.size;
  }
}

export class InverseObservalbeSet<T> extends ObservableSet<T> {
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

export class ObservableArray<T> {
  #array: T[] = [];
  #addObs = new Observable<T>();
  #removeObs = new Observable<T>();

  get length() {
    return this.#array.length;
  }

  push(value: T) {
    this.#array.push(value);
    this.#addObs.next(value);
  }

  pop() {
    const value = this.#array.pop();
    this.#removeObs.next(value!);
    return value;
  }

  at(index: number) {
    return this.#array.at(index);
  }

  delete(index: number) {
    const array = this.#array;
    this.#removeObs.next(array[index]);
    delete array[index];
  }

  onAdd(observer: (value: T) => void) {
    return this.#addObs.subscribe(observer);
  }

  onRemove(observer: (value: T) => void) {
    return this.#removeObs.subscribe(observer);
  }

  toJSON() {
    return [...this.#array];
  }
}

export const ObservableKey = Symbol("OnChange");
export const OnChangeKey = Symbol("OnChange");

export interface IObservableObject<T> {
  [ObservableKey]: Observable<keyof T>;
  [OnChangeKey]: (observer: (key: keyof T) => void) => IObservableSubscription;
}

function canBeObservableObject(obj: any): obj is {} {
  const typeName = typeof obj;
  return (
    (typeName === "object" || typeName === "function") &&
    obj !== null &&
    !(obj instanceof Observable) &&
    !isProxy(obj)
  );
}

/** recursively make all of an object's object properties observable */
function observeDescendentObjects<T extends {}>(obj: T): T {
  for (const [key, value] of Object.entries(obj)) {
    if (canBeObservableObject(value)) {
      obj[key as keyof T] = new ObservableObject(value) as any;
    }
  }
  return obj;
}

function canBeObservableKey(key: string | symbol) {
  return key !== ObservableKey && key !== OnChangeKey;
}

export class ObservableObjectOptions {
  recursive = true;
  testValue(value: any) {
    void value;
    return true;
  }
}

const defaultOOOptions = new ObservableObjectOptions();

const _proxies = new WeakSet();
function createProxy<T extends object>(target: T, handler: ProxyHandler<T>) {
  const proxy = new Proxy(target, handler);
  _proxies.add(proxy);
  return proxy;
}

function isProxy(obj: any) {
  return _proxies.has(obj);
}

export class ObservableObject<T extends {} = {}> {
  constructor(target = {} as T, options = defaultOOOptions) {
    const { recursive, testValue } = options;
    if (recursive) {
      observeDescendentObjects(target);
    }

    (target as T & IObservableObject<T>)[ObservableKey] = new Observable<
      keyof T
    >();

    (target as T & IObservableObject<T>)[OnChangeKey] = (
      observer: (key: keyof T) => void
    ) => {
      return result[ObservableKey].subscribe(observer);
    };

    const result = createProxy(target, {
      defineProperty(target, key, attributes) {
        let { value } = attributes;
        if (
          recursive &&
          testValue(value) &&
          canBeObservableObject(value) &&
          canBeObservableKey(key)
        ) {
          value = new ObservableObject(value);
          value[ObservableKey].subscribe(() => {
            result[ObservableKey].next(key as keyof T);
          });
          attributes.value = value;
        }
        return Reflect.defineProperty(target, key, attributes);
      },
      set: (target, key, value) => {
        if (
          recursive &&
          testValue(value) &&
          canBeObservableObject(value) &&
          canBeObservableKey(key)
        ) {
          value = new ObservableObject(value);
          (value as IObservableObject<T>)[ObservableKey].subscribe((key) => {
            result[ObservableKey].next(key as keyof T);
          });
        }
        target[key as keyof T] = value;
        if (canBeObservableKey(key)) {
          result[ObservableKey].next(key as keyof T);
        }
        return true;
      },
      deleteProperty: (target, key) => {
        delete target[key as keyof T];
        result[ObservableKey].next(key as keyof T);
        return true;
      },
      get(target, key) {
        return target[key as keyof T];
      },
      apply(target, thisArg, argArray) {
        return (target as any).apply(thisArg, argArray);
      }
    }) as T & IObservableObject<T>;

    return result;
  }
}
