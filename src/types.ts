type ExtendRecord<
  T extends Record<string, any>,
  NewKey extends string,
  NewValue
> = T & Record<NewKey, NewValue>;

type GenericFunction<Args extends any[], ReturnType> = (
  ...args: Args
) => ReturnType;

interface Enumerable<T> {
  [Symbol.iterator](): IterableIterator<T>;
}

interface IConstructor<T = {}> {
  new (...args: any[]): T;
}

/* UnionToIntersection
 *  example:
 *
 * type T = [A, B];
 * UnionToIntersection<T[number]> = A & B;
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type ReadonlyRecursive<T, Except = never> = {
  readonly [P in keyof T]: T[P] extends Except
    ? T[P]
    : T[P] extends object
      ? T[P] extends Function
        ? T[P]
        : ReadonlyRecursive<T[P]>
      : T[P];
};
