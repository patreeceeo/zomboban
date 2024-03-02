interface SystemService<Context> {
  update(context: Context): void;
}

export interface ISystemConstructor<Context> {
  new (mgr: SystemManager<Context>): System<Context>;
}

export class System<Context> {
  constructor(readonly mgr = new SystemManager<Context>()) {}
  start(context: Context) {
    void context;
  }
  update(context: Context) {
    void context;
  }
  stop(context: Context) {
    void context;
  }
  services = [] as SystemService<Context>[];
}

export class SystemManager<Context> {
  Systems = new Set<ISystemConstructor<Context>>();
  systems = [] as System<Context>[];
  push(System: ISystemConstructor<Context>, context: Context) {
    if (!this.Systems.has(System)) {
      const system = new System(this);
      system.start(context);
      this.Systems.add(System);
      this.systems.push(system);
    }
  }
  update(context: Context) {
    for (const system of this.systems) {
      system.update(context);
    }
  }
  updateServices(context: Context) {
    for (const system of this.systems) {
      for (const service of system.services) {
        service.update(context);
      }
    }
  }
  remove(System: ISystemConstructor<Context>, context: Context) {
    this.Systems.delete(System);
    for (const [index, system] of this.systems.entries()) {
      if (system.constructor === System) {
        system.stop(context);
        this.systems.splice(index, 1);
        break;
      }
    }
  }
}
