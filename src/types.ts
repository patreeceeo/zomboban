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

interface IConstructor<T = {}, Args extends any[] = any[]> {
  new (...args: Args): T;
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

type AnyRecordOf<T> = Record<string | number | symbol, T>;
type AnyObject = AnyRecordOf<any>;

// TODO reconsider when the `using` keyword is widely supported
// https://github.com/tc39/proposal-explicit-resource-management/tree/main
interface IResourceHandle {
  release(): void;
}

interface HtmxRequestDetails {
  xhr: XMLHttpRequest;
  target: HTMLElement;
  requestConfig: any;
  etc: any;
  boosted: boolean;
  select: string;
  pathInfo: any;
  elt: HTMLElement;
  failed: boolean;
  successful: boolean;
}
