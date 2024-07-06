export class SecretlyWritableSet<T> extends Set<T> {
  add(value: T): this {
    void value;
    throw "Cannot add to a readonly set";
  }
  _add(value: T): this {
    return super.add(value);
  }
}
