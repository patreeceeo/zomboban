export function filterArrayInPlace<T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => boolean
): void {
  let i = 0;
  let j = 0;
  while (i < array.length) {
    if (predicate(array[i], i, array)) {
      array[j] = array[i];
      j++;
    }
    i++;
  }
  array.length = j;
}
