export function createSet<T>(): Set<T> {
  return new Set();
}

export function popFromSet<T>(set: Set<T>): T {
  const value = set.values().next().value as T;
  set.delete(value);
  return value;
}

export function getUnionSet<T>(sets: Set<T>[], target = new Set<T>()): Set<T> {
  for (const set of sets) {
    for (const item of set) {
      target.add(item);
    }
  }
  return target;
}

export function getIntersectionSet<T>(
  sets: Set<T>[],
  target = new Set<T>()
): Set<T> {
  const union = getUnionSet(sets);
  for (const item of union) {
    let allHasItem = true;
    for (const set of sets) {
      allHasItem &&= set.has(item);
    }
    if (allHasItem) {
      target.add(item);
    }
  }
  return target;
}
