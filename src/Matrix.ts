import { invariant } from "./Error";
import { SecretlyWritableSet } from "./collections/SecretlyWritableSet";

// TODO move to ./collections ?

function assertInts(x: number, y: number, z: number): void {
  invariant(Number.isInteger(x), `x must be an integer, got ${x}`);
  invariant(Number.isInteger(y), `y must be an integer, got ${y}`);
  invariant(Number.isInteger(y), `z must be an integer, got ${z}`);
}

export class Matrix<T, Default = undefined> {
  #data = [] as T[][][];
  #minX = 0;
  #minY = 0;
  #minZ = 0;
  set(x: number, y: number, z: number, value: T) {
    assertInts(x, y, z);
    this.#data[z] ??= [];
    this.#data[z][y] ??= [];
    this.#data[z][y][x] = value;
    if (x < this.#minX) {
      this.#minX = x;
    }
    if (y < this.#minY) {
      this.#minY = y;
    }
    if (z < this.#minZ) {
      this.#minZ = z;
    }
    return this;
  }
  get(x: number, y: number, z: number): T | Default {
    assertInts(x, y, z);
    return this.#data[z]?.[y]?.[x];
  }
  atPoint({ x, y, z }: { x: number; y: number; z: number }): T | Default {
    return this.get(x, y, z);
  }
  has(x: number, y: number, z: number): boolean {
    assertInts(x, y, z);
    return this.#data[z]?.[y]?.[x] !== undefined;
  }
  delete(x: number, y: number, z: number): void {
    assertInts(x, y, z);
    delete this.#data[z]?.[y]?.[x];
  }
  clear(): void {
    this.#data = [];
  }
  toJS(): T[][][] {
    return this.#data;
  }
  /** includes negative indexes */
  *entries(): IterableIterator<[number, number, number, T]> {
    const slices = this.#data;
    const sliceCount = slices.length;
    for (let z = this.#minZ; z < sliceCount; z++) {
      const rows = slices[z];
      if (rows) {
        const rowCount = rows.length;
        for (let y = this.#minY; y < rowCount; y++) {
          const row = rows[y];
          if (row) {
            const columnCount = row.length;
            for (let x = this.#minX; x < columnCount; x++) {
              if (x in row) {
                yield [x, y, z, row[x]];
              }
            }
          }
        }
      }
    }
  }
}

export class MatrixOfIterables<T> extends Matrix<Set<T>, Iterable<T>> {
  #emptySet = new SecretlyWritableSet<T>();
  add(x: number, y: number, z: number, value: T) {
    if (super.has(x, y, z)) {
      const set = super.get(x, y, z)! as SecretlyWritableSet<T>;
      set._add(value);
    } else {
      const set = new SecretlyWritableSet<T>();
      set._add(value);
      super.set(x, y, z, set);
    }
    return this;
  }
  subtract(x: number, y: number, z: number, value: T) {
    if (super.has(x, y, z)) {
      const set = super.get(x, y, z)! as Set<T>;
      return set.delete(value);
    }
    return false;
  }
  hasItem(x: number, y: number, z: number, item: T) {
    return (this.get(x, y, z) as Set<T>).has(item);
  }
  get(x: number, y: number, z: number): Iterable<T> {
    const value = super.get(x, y, z);
    return value ?? this.#emptySet;
  }
}
