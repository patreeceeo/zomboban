const emptyArray = [] as any[];
export function getEmptyArray<T>() {
  return emptyArray as readonly T[];
}
