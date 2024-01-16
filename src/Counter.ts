export class Counter {
  value: number;
  constructor(
    public max = Infinity,
    public step = 1,
    start = 0,
  ) {
    this.value = start;
  }

  next(): void {
    const { step, max, value } = this;
    const newValue = value + step;
    this.value = Math.min(newValue, max);
  }

  advance(amount: number): void {
    const { step, max, value } = this;
    const newValue = value + step * amount;
    this.value = Math.min(newValue, max);
  }

  get isMax(): boolean {
    return this.value === this.max;
  }

  get progress(): number {
    return this.value / this.max;
  }
}

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
