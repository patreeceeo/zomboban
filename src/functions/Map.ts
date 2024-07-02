export function updateMapKey<Key, Value>(
  map: Map<Key, Value>,
  key: Key,
  update: (value: Value) => Value,
  getDefault: () => Value
): void {
  const value = map.get(key) ?? getDefault();
  const newValue = update(value);
  map.set(key, newValue);
}
