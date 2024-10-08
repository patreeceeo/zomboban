export class InstanceMap<PCtor extends IConstructor<any, any[]>> extends Map<
  PCtor,
  Set<InstanceType<PCtor>>
> {
  add(...instances: InstanceType<PCtor>[]) {
    for (const instance of instances) {
      const ctor = instance.constructor as PCtor;
      const set = this.get(ctor) ?? new Set();
      set.add(instance);
      this.set(ctor, set);
    }
  }
  // TODO test
  delete(instance: InstanceType<PCtor>) {
    const ctor = instance.constructor as PCtor;
    const set = this.get(ctor);
    if (set !== undefined) {
      let result = set.delete(instance);
      if (set.size === 0) {
        super.delete(ctor);
      }
      return result;
    }
    return false;
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
  // TODO test
  get sizeFlat() {
    let result = 0;
    for (const set of this.values()) {
      result += set.size;
    }
    return result;
  }

  count(msgTypes: Iterable<PCtor>) {
    let result = 0;
    for (const type of msgTypes) {
      result += this.getAll(type).size;
    }
    return result;
  }
}
