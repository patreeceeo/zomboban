import {
  DEBUG,
  getDebugAlias,
  isProduction,
  setDebugAlias,
  setLateBindingDebugAlias
} from "./Debug";

export interface IObservable<T> {
  subscribe(observer: (value: T) => void): IResourceHandle;
  next(value: T): void;
}

export interface IReadonlyObservableSet<T> {
  [Symbol.iterator](): IterableIterator<T>;
  has(entity: T): boolean;
  onAdd(observer: (value: T) => void): IResourceHandle;
  stream(observer: (value: T) => void): IResourceHandle;
  onRemove(observer: (value: T) => void): IResourceHandle;
  debug: boolean;
}

export interface IObservableSet<T> extends IReadonlyObservableSet<T> {
  add(entity: T): void;
  remove(entity: T): void;
  clear(): void;
  unobserve(): void;
}

export class Observable<T> {
  #observers = new Set<(value: T) => void>();

  subscribe(observer: (value: T) => void): IResourceHandle {
    this.#observers.add(observer);
    return {
      release: () => {
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

  get size() {
    return this.#observers.size;
  }
}

// TODO make this a subclass of Set
export class ObservableSet<T> implements IObservableSet<T> {
  set = new Set<T>();
  addObs = new Observable<T>();
  removeObs = new Observable<T>();

  debug = false;

  constructor(collection: Iterable<T> = []) {
    if (!isProduction()) {
      setLateBindingDebugAlias(
        this.addObs,
        () => `${getDebugAlias(this)}.addObs`
      );
      setDebugAlias(this.removeObs, `${getDebugAlias(this)}.removeObs`);
    }
    for (const entity of collection) {
      this.set.add(entity);
    }
  }

  [Symbol.iterator]() {
    return this.set.values();
  }

  add(entity: T) {
    if (this.debug) {
      console.log(`${getDebugAlias(this)}.add`, entity);
    }
    this.set.add(entity);
    this.addObs.next(entity);
  }

  has(entity: T) {
    return this.set.has(entity);
  }

  remove(entity: T) {
    this.set.delete(entity);
    this.removeObs.next(entity);
  }

  clear(notify = false) {
    if (notify) {
      for (const entity of this.set) {
        this.removeObs.next(entity);
      }
    }
    this.set.clear();
  }

  unobserve() {
    this.addObs.clear();
    this.removeObs.clear();
  }

  onAdd(observer: (value: T) => void) {
    return this.addObs.subscribe(observer);
  }

  stream(observer: (value: T) => void) {
    for (const entity of this.set) {
      observer(entity);
    }
    return this.addObs.subscribe(observer);
  }

  onRemove(observer: (value: T) => void) {
    return this.removeObs.subscribe(observer);
  }

  get size() {
    return this.set.size;
  }
}

export class ObservableMap<Key, Value> extends Map<Key, Value> {
  #setObservable = new Observable<[Key, Value]>();
  #deleteObservable = new Observable<[Key, Value]>();
  #handleDelete(key: Key, value?: Value) {
    if (value !== undefined) {
      this.#deleteObservable.next([key, value]);
    }
  }
  set(key: Key, value: Value) {
    const existingValue = this.get(key);
    if (existingValue !== value) {
      this.#handleDelete(key, existingValue);
      this.#setObservable.next([key, value]);
      return super.set(key, value);
    }
    return this;
  }
  delete(key: Key) {
    this.#handleDelete(key, this.get(key));
    return super.delete(key);
  }

  onSet(observer: (entry: [Key, Value]) => void) {
    return this.#setObservable.subscribe(observer);
  }

  onDelete(observer: (entry: [Key, Value]) => void) {
    return this.#deleteObservable.subscribe(observer);
  }
}

export class ObservableArray<T> {
  #array: T[];
  #addObs = new Observable<T>();
  #removeObs = new Observable<T>();

  constructor(array: T[] = []) {
    this.#array = array;
  }

  get length() {
    return this.#array.length;
  }

  set length(value: number) {
    const array = this.#array;
    const oldValue = array.length;
    for (let i = value; i < oldValue; i++) {
      this.#removeObs.next(array[i]);
    }
    array.length = value;
  }

  push(...values: T[]) {
    this.#array.push(...values);
    for (const value of values) {
      this.#addObs.next(value);
    }
  }

  pop() {
    const value = this.#array.pop();
    this.#removeObs.next(value!);
    return value;
  }

  unshift(value: T) {
    this.#array.unshift(value);
    this.#addObs.next(value);
  }

  shift() {
    const value = this.#array.shift();
    if (value) {
      this.#removeObs.next(value);
    }
    return value;
  }

  at(index: number) {
    return this.#array.at(index);
  }

  set(index: number, value: T) {
    const array = this.#array;
    if (index in array) {
      this.#removeObs.next(array[index]);
    }
    this.#addObs.next(value);
    array[index] = value;
  }

  delete(index: number) {
    const array = this.#array;
    this.#removeObs.next(array[index]);
    delete array[index];
  }

  splice(start: number, deleteCount: number) {
    const array = this.#array;
    const end = start + deleteCount;
    for (let index = start; index < end; index++) {
      this.#removeObs.next(array[index]);
    }
    array.splice(start, deleteCount);
  }

  stream(observer: (value: T) => void) {
    for (const entity of this.#array) {
      observer(entity);
    }
    return this.#addObs.subscribe(observer);
  }

  entries() {
    return this.#array.entries();
  }

  keys() {
    return this.#array.keys();
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

  [Symbol.iterator]() {
    return this.#array.values();
  }

  #indexes = [] as number[];
  filterInPlace(
    predicate: (value: T, index: number, array: T[]) => boolean
  ): void {
    let index: number | undefined;
    const array = this.#array;
    const indexes = this.#indexes;
    for (const [index, item] of array.entries()) {
      if (!predicate(item, index, array)) {
        this.#removeObs.next(item);
        this.#indexes.push(index);
      }
    }
    while ((index = indexes.pop()) !== undefined) {
      array.splice(index, 1);
    }
  }

  filter(predicate: (value: T, index: number, array: T[]) => boolean) {
    return this.#array.filter(predicate);
  }

  findLast(predicate: (value: T, index: number, array: T[]) => boolean) {
    return (this.#array as any).findLast(predicate) as T | undefined;
  }
}

// export const ObservableKey = Symbol("OnChange");
// export const OnChangeKey = Symbol("OnChange");

// export interface IObservableObject<T> {
//   [ObservableKey]: Observable<keyof T>;
//   [OnChangeKey]: (observer: (key: keyof T) => void) => IResourceHandle;
// }

// function canBeObservableObject(obj: any): obj is {} {
//   const typeName = typeof obj;
//   return (
//     (typeName === "object" || typeName === "function") &&
//     obj !== null &&
//     !(obj instanceof Observable) &&
//     !isProxy(obj)
//   );
// }

// /** recursively make all of an object's object properties observable */
// function observeDescendentObjects<T extends {}>(obj: T): T {
//   for (const [key, value] of Object.entries(obj)) {
//     if (canBeObservableObject(value)) {
//       obj[key as keyof T] = new ObservableObject(value) as any;
//     }
//   }
//   return obj;
// }

// function canBeObservableKey(key: string | symbol) {
//   return key !== ObservableKey && key !== OnChangeKey;
// }

// export class ObservableObjectOptions {
//   recursive = true;
//   testValue(value: any) {
//     void value;
//     return true;
//   }
// }

// const defaultOOOptions = new ObservableObjectOptions();

// const _proxies = new WeakSet();
// function createProxy<T extends object>(target: T, handler: ProxyHandler<T>) {
//   const proxy = new Proxy(target, handler);
//   _proxies.add(proxy);
//   return proxy;
// }

// function isProxy(obj: any) {
//   return _proxies.has(obj);
// }

// export class ObservableObject<T extends {} = {}> {
//   constructor(target = {} as T, options = defaultOOOptions) {
//     const { recursive, testValue } = options;
//     if (recursive) {
//       observeDescendentObjects(target);
//     }

//     (target as T & IObservableObject<T>)[ObservableKey] = new Observable<
//       keyof T
//     >();

//     (target as T & IObservableObject<T>)[OnChangeKey] = (
//       observer: (key: keyof T) => void
//     ) => {
//       return result[ObservableKey].subscribe(observer);
//     };

//     const result = createProxy(target, {
//       defineProperty(target, key, attributes) {
//         let { value } = attributes;
//         if (
//           recursive &&
//           testValue(value) &&
//           canBeObservableObject(value) &&
//           canBeObservableKey(key)
//         ) {
//           value = new ObservableObject(value);
//           value[ObservableKey].subscribe(() => {
//             result[ObservableKey].next(key as keyof T);
//           });
//           attributes.value = value;
//         }
//         return Reflect.defineProperty(target, key, attributes);
//       },
//       set: (target, key, value) => {
//         if (
//           recursive &&
//           testValue(value) &&
//           canBeObservableObject(value) &&
//           canBeObservableKey(key)
//         ) {
//           value = new ObservableObject(value);
//           (value as IObservableObject<T>)[ObservableKey].subscribe((key) => {
//             result[ObservableKey].next(key as keyof T);
//           });
//         }
//         target[key as keyof T] = value;
//         if (canBeObservableKey(key)) {
//           result[ObservableKey].next(key as keyof T);
//         }
//         return true;
//       },
//       deleteProperty: (target, key) => {
//         delete target[key as keyof T];
//         result[ObservableKey].next(key as keyof T);
//         return true;
//       },
//       get(target, key) {
//         return target[key as keyof T];
//       },
//       apply(target, thisArg, argArray) {
//         return (target as any).apply(thisArg, argArray);
//       }
//     }) as T & IObservableObject<T>;

//     return result;
//   }
// }
