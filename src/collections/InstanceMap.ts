export class SingletonMap<PCtor extends IConstructor<any>> extends Map<
  PCtor,
  InstanceType<PCtor>
> {
  add(...instances: InstanceType<PCtor>[]) {
    if (instances.length > 0) {
      for (const instance of instances) {
        const ctor = instance.constructor as PCtor;
        this.set(ctor, instance);
      }
    }
  }
  get<PCtorArg extends IConstructor<any>>(
    ctor: PCtorArg
  ): InstanceType<PCtorArg> | undefined {
    return super.get(ctor as any) as InstanceType<PCtorArg>;
  }
  delete(instance: InstanceType<PCtor>) {
    const ctor = instance.constructor as PCtor;
    return super.delete(ctor);
  }
}

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
}
