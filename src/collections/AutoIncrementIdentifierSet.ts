export class AutoIncrementIdentifierSet extends Set<number> {
  #minValue = 0;
  nextValue() {
    let value = this.#minValue;
    while (this.has(value)) {
      value++;
    }
    return value;
  }
  // TODO override delete method to update minValue
}
