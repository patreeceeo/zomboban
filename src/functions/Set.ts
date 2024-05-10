export function popFromSet<T>(set: Set<T>): T {
  const value = set.values().next().value as T;
  set.delete(value);
  return value;
}
