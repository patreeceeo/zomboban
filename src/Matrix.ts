import { invariant } from "./Error";

function assertInts(x: number, y: number): void {
  invariant(Number.isInteger(x), `x must be an integer, got ${x}`);
  invariant(Number.isInteger(y), `y must be an integer, got ${y}`);
}

export class Matrix<T> {
  #data: Array<Array<T>> = [];
  set(x: number, y: number, value: T): T {
    assertInts(x, y);
    this.#data[y] = this.#data[y] || [];
    this.#data[y][x] = value;
    return value;
  }
  get(x: number, y: number): T {
    assertInts(x, y);
    return this.#data[y]?.[x];
  }
  has(x: number, y: number): boolean {
    assertInts(x, y);
    return this.#data[y]?.[x] !== undefined;
  }
  delete(x: number, y: number): void {
    assertInts(x, y);
    delete this.#data[y]?.[x];
  }
  clear(): void {
    this.#data = [];
  }
  toJS(): Array<Array<T>> {
    return this.#data;
  }
  forEach(callback: (value: T, x: number, y: number) => void): void {
    this.#data.forEach((row, y) => {
      row.forEach((value, x) => {
        callback(value, x, y);
      });
    });
  }
}
