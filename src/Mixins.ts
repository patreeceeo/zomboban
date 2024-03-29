class Empty {}

export type MixinType<Mixin extends (Base: IConstructor) => IConstructor> =
  InstanceType<ReturnType<Mixin>>;

interface Mixin<Mix> {
  <Base extends IConstructor>(Base: Base): IConstructor<Mix>;
}

export function hasMixin<M extends Mixin<Mix>, Mix>(object: any, mixin: M) {
  const Mixed = mixin(Object);
  const mixed = new Mixed();
  for (const key in mixed) {
    if (!(key in object) || typeof object[key] !== typeof mixed[key]) {
      return false;
    }
  }
  return true;
}

/** A function that allows writing more readable code by passing an array of mixins
 * to be composed, and importantly, allowing the type of the state to be inferred from
 * the mixins.
 *
 * @example
 * export const MyClass = AMixin(
 *   BMixin(
 *     CMixin(
 *       class {}
 *     )
 *   )
 * );
 * becomes
 * export const MyClass = composeMixins(
 *  AMixin,
 *  BMixin,
 *  CMixin
 * )
 */
export function composeMixins<M extends Mixin<any>[]>(
  ...mixins: M
): IConstructor<UnionToIntersection<MixinType<M[number]>>> {
  let Result = Empty;
  for (const mixin of mixins) {
    Result = mixin(Result);
  }
  return Result as any;
}

/** a mixin that adds a property getter and setter */
export function WithGetterSetter<
  PropName extends string,
  Value,
  Ctor extends IConstructor<any>
>(
  propName: PropName,
  get: (c: InstanceType<Ctor>) => Value,
  set: (c: InstanceType<Ctor>, value: Value) => void,
  ctor = Empty as Ctor
) {
  return class WithGetterSetter extends ctor {
    constructor(...args: any[]) {
      super(...args);
      Object.defineProperty(this, propName, {
        get: () => get(this as InstanceType<Ctor>),
        set: (value: Value) => set(this as InstanceType<Ctor>, value)
      });
    }
  } as unknown as Ctor extends new (...args: infer Args) => infer Instance
    ? new (...args: Args) => Instance & Record<PropName, Value>
    : never;
}

// TODO restore WithObjectProperties from stash
