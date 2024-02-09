type ExtendRecord<
  T extends Record<string, any>,
  NewKey extends string,
  NewValue,
> = T & Record<NewKey, NewValue>;

type GenericFunction<Args extends any[], ReturnType> = (
  ...args: Args
) => ReturnType;

interface Enumerable<T> {
  [Symbol.iterator](): IterableIterator<T>;
}
