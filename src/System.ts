import { QueryState } from "./state";

interface SystemService<Context> {
  update(context: Context): void;
}

export interface ISystemConstructor<Context extends AnyObject> {
  new (mgr: SystemManager<Context>): System<Context>;
}

export class System<Context extends AnyObject> {
  constructor(readonly mgr: SystemManager<Context>) {}
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

export class SystemWithQueries<
  Context extends QueryState
> extends System<Context> {
  createQuery(...args: Parameters<QueryState["query"]>) {
    return this.mgr.context.query(...args);
  }
}

export class SystemManager<Context extends AnyObject> {
  constructor(public context: Context) {}
  Systems = new Set<ISystemConstructor<any>>();
  systems = [] as System<any>[];
  push(System: ISystemConstructor<any>) {
    if (!this.Systems.has(System)) {
      const system = new System(this);
      system.start(this.context);
      this.Systems.add(System);
      this.systems.push(system);
    }
  }
  update() {
    const { context } = this;
    for (const system of this.systems) {
      system.update(context);
    }
  }
  updateServices() {
    const { context } = this;
    for (const system of this.systems) {
      for (const service of system.services) {
        service.update(context);
      }
    }
  }
  remove(System: ISystemConstructor<any>) {
    const { context } = this;
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
