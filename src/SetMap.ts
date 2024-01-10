import { invariant } from "./Error";

export class SetMap<Key, Value> {
  #map = new Map<Key, Set<Value>>();
  add(key: Key, value: Value) {
    const map = this.#map;
    let values = map.get(key);
    if (!map.has(key)) {
      values = new Set();
      this.#map.set(key, values);
    }
    values!.add(value);
  }
  deleteKey(key: Key) {
    this.#map.delete(key);
  }
  deleteValue(key: Key, value: Value) {
    const map = this.#map;
    const values = map.get(key);
    if (!map.has(key)) {
      return;
    }
    values!.delete(value);
    if (values!.size === 0) {
      this.#map.delete(key);
    }
  }
  hasKey(key: Key) {
    return this.#map.has(key);
  }
  getValues(key: Key) {
    invariant(this.hasKey(key), `Key ${key} does not exist in SetMap`);
    return this.#map.get(key)!.values();
  }
  getValuesIfHasKey(key: Key) {
    return this.hasKey(key) ? this.getValues(key) : [];
  }
  entries() {
    return this.#map.entries();
  }
  clear() {
    this.#map.clear();
  }
  get size() {
    return this.#map.size;
  }
}
