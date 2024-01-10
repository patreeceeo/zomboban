export function filterInPlace<T>(array: T[], predicate: (value: T) => boolean) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (!predicate(array[i])) {
      array.splice(i, 1);
    }
  }
}
