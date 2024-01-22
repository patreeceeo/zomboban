export class Lazy<T> {
  #value: T | undefined;
  constructor(private readonly factory: () => T) {}
  get() {
    return this.#value !== undefined
      ? this.#value
      : (this.#value = this.factory());
  }
  valueOf() {
    return this.get();
  }
}
