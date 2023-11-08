import { invariant } from "./Error";

function assertInts(x: number, y: number): void {
  invariant(Number.isInteger(x), `x must be an integer, got ${x}`);
  invariant(Number.isInteger(y), `y must be an integer, got ${y}`);
}

export class Matrix<T> {
  #data: Array<Array<T>> = [];
  set(x: number, y: number, value: T): void {
    assertInts(x, y);
    this.#data[x] = this.#data[x] || [];
    this.#data[x][y] = value;
  }
  get(x: number, y: number): T {
    assertInts(x, y);
    return this.#data[x]?.[y];
  }
  has(x: number, y: number): boolean {
    assertInts(x, y);
    return this.#data[x]?.[y] !== undefined;
  }
  delete(x: number, y: number): void {
    assertInts(x, y);
    delete this.#data[x]?.[y];
  }
}
