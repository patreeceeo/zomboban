export class LoopCounter {
  #value: number;
  constructor(
    public max = 0,
    public min = 0,
    public step = 1,
    start = 0,
  ) {
    this.#value = start;
  }

  next(): void {
    this.#value += this.step;
    if (this.#value > this.max) {
      this.#value = this.min;
    }
    if (this.#value < this.min) {
      this.#value = this.max;
    }
  }

  get value(): number {
    return this.#value;
  }
}
