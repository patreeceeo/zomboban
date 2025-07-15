const emptySet = new Set<any>();
export class Multimap<K, V> extends Map<K, Set<V>> {
  add(key: K, value: V): void {
    if (!this.has(key)) {
      this.set(key, new Set<V>());
    }
    this.get(key)!.add(value);
  }

  remove(key: K, value: V): void {
    const values = this.get(key);
    if (values) {
      values.delete(value);
      if (values.size === 0) {
        this.delete(key);
      }
    }
  }

  getWithDefault(key: K): Set<V> {
    return this.get(key) ?? emptySet;
  }
}
