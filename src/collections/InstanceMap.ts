export class InstanceMap<PCtor extends IConstructor<any>> extends Map<
  PCtor,
  Set<InstanceType<PCtor>>
> {
  add(...instances: InstanceType<PCtor>[]) {
    if (instances.length > 0) {
      const ctor = instances[0].constructor as PCtor;
      const set = this.get(ctor) ?? new Set();
      for (const instance of instances) {
        set.add(instance);
      }
      this.set(ctor, set);
    }
  }
  getAll<PCtorArg extends IConstructor<any>>(ctor: PCtorArg) {
    let result = this.get(ctor as any);
    if (!result) {
      result = new Set();
      this.set(ctor as any, result);
    }
    return result as unknown as Set<InstanceType<PCtorArg>>;
  }
  valuesFlat(): Iterable<InstanceType<PCtor>> {
    const result = [];
    for (const set of this.values()) {
      for (const item of set) {
        result.push(item);
      }
    }
    return result;
  }
}
