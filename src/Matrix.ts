import { invariant } from "./Error";

function assertInts(x: number, y: number, z: number): void {
  invariant(Number.isInteger(x), `x must be an integer, got ${x}`);
  invariant(Number.isInteger(y), `y must be an integer, got ${y}`);
  invariant(Number.isInteger(y), `z must be an integer, got ${z}`);
}

export class Matrix<T> {
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
  get(x: number, y: number, z: number): T | undefined {
    assertInts(x, y, z);
    return this.#data[z]?.[y]?.[x];
  }
  atPoint({ x, y, z }: { x: number; y: number; z: number }): T | undefined {
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
