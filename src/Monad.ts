export class AwaitedValue<T> {
  constructor(public awaitedValue?: T) {}
  toString() {
    return `AwaitedValue ${this.awaitedValue}`;
  }
}
