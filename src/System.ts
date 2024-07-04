import { IReadonlyComponentDefinition } from "./Component";
import { LogLevel, LogSubject } from "./Log";
import { QueryState } from "./state";
import { log } from "./util";

interface SystemService<Context> {
  update(context: Context): void;
}

export interface ISystemConstructor<Context extends AnyObject> {
  new (mgr: SystemManager<Context>): System<Context>;
}

export class System<Context extends AnyObject> {
  resources = [] as IResourceHandle[];
  #logSubject = new LogSubject(this.toString());
  constructor(readonly mgr: SystemManager<Context>) {
    log.addSubject(this.#logSubject);
  }
  log(message: string, level?: LogLevel) {
    this.#logSubject.append(message, level);
  }
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
  toString() {
    return this.constructor.name;
  }
}

export class SystemWithQueries<
  Context extends QueryState
> extends System<Context> {
  createQuery<Components extends readonly IReadonlyComponentDefinition<any>[]>(
    components: Components
  ) {
    return this.mgr.context.query(components);
  }
}

export class SystemManager<Context extends AnyObject> {
  constructor(public context: Context) {}
  Systems = new Set<ISystemConstructor<any>>();
  systems = [] as System<any>[];
  push(...Systems: ISystemConstructor<any>[]) {
    for (const System of Systems) {
      if (!this.Systems.has(System)) {
        const system = new System(this);
        system.start(this.context);
        this.Systems.add(System);
        this.systems.push(system);
      }
    }
  }
  insert(System: ISystemConstructor<any>, index = 0) {
    const system = new System(this);
    system.start(this.context);
    this.Systems.add(System);
    this.systems.splice(index, 0, system);
  }
  reorder(System: ISystemConstructor<any>, toIndex = 0) {
    let index = 0;
    for (const system of this.systems) {
      if (system instanceof System) {
        this.systems.splice(index, 1);
        this.systems.splice(toIndex, 0, system);
        break;
      }
      index++;
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
        for (const resource of system.resources) {
          resource.release();
        }
        this.systems.splice(index, 1);
        break;
      }
    }
  }
  clear() {
    const { context } = this;
    for (const system of this.systems) {
      system.stop(context);
      for (const resource of system.resources) {
        resource.release();
      }
    }
    this.Systems.clear();
    this.systems.length = 0;
  }
}
