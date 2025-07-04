import { invariant } from "../Error";
import { isNumber } from "../util";

export class NumberKeyedMap<Value> implements Map<number, Value> {
  #array = [] as Value[];
  get(key: number) {
    invariant(isNumber(key), "key must be a number");
    return this.#array[key];
  }
  set(key: number, value: any) {
    invariant(isNumber(key), "key must be a number");
    this.#array[key] = value;
    return this;
  }
  has(key: number): boolean {
    invariant(isNumber(key), "key must be a number");
    return key in this.#array;
  }
  delete(key: number): boolean {
    invariant(isNumber(key), "key must be a number");
    const result = this.has(key);
    delete this.#array[key];
    return result;
  }
  clear(): void {
    this.#array.length = 0;
  }
  *keys(): IterableIterator<number> {
    for (const key of this.#array.keys()) {
      if (this.has(key)) {
        yield key;
      }
    }
  }
  *values(): IterableIterator<Value> {
    for (const key of this.keys()) {
      yield this.get(key);
    }
  }
  *entries(): IterableIterator<[number, Value]> {
    for (const key of this.keys()) {
      yield [key, this.get(key)];
    }
  }
  forEach(
    callbackfn: (value: Value, key: number, map: Map<number, Value>) => void,
    thisArg: any = null
  ): void {
    for (const [key, value] of this.entries()) {
      callbackfn.call(thisArg, value, key, this);
    }
  }
  [Symbol.iterator]() {
    let index = 0;
    const length = this.size;
    const collection = this;
    return {
      next() {
        index++;
        if (index < length) {
          return {
            value: [index, collection.get(index)] as const,
            done: false
          };
        } else {
          return { value: null, done: true };
        }
      }
    } as IterableIterator<[number, Value]>;
  }
  get [Symbol.toStringTag]() {
    return "AutoIncrementIdentifierMap";
  }
  get size() {
    return this.#array.length;
  }
  findEmtpyIndex(start: number = 0): number {
    let i = start;
    for (; i < this.#array.length; i++) {
      if (!this.has(i)) {
        break;
      }
    }
    return i;
  }
}
