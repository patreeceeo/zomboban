class Empty {}

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
