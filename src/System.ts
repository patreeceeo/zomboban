import { LogLevel } from "./Log";
import {IQueryPredicate} from "./Query";
import { State } from "./state";
import { log } from "./util";

interface SystemService<Context> {
  update(context: Context): void;
}

export interface ISystemConstructor<Context extends AnyObject> {
  new (mgr: SystemManager<Context>): System<Context>;
}

export class System<Context extends AnyObject> {
  resources = [] as IResourceHandle[];
  constructor(readonly mgr: SystemManager<Context>) {}
  log(message: string, level?: LogLevel, ...addtlSubjects: any[]) {
    log.append(message, level, this, ...addtlSubjects);
  }
  start(context: Context): Promise<void> | void {
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
  Context extends State
> extends System<Context> {
  createQuery<Components extends readonly IQueryPredicate<any>[]>(
    components: Components
  ) {
    return this.mgr.context.query.create(components);
  }
}

export class SystemManager<Context extends AnyObject> {
  constructor(public context: Context) {}
  Systems = new Set<ISystemConstructor<any>>();
  systems = [] as System<any>[];
  readySystems = [] as System<any>[];

  async #startSystem(system: System<any>) {
    const startResult = system.start(this.context);

    if (startResult !== undefined) {
      await startResult;
      this.readySystems.push(system);
    } else {
      // Synchronous start - system is immediately ready
      this.readySystems.push(system);
    }
  }
  
  async push(...Systems: ISystemConstructor<any>[]) {
    for (const System of Systems) {
      if (!this.Systems.has(System)) {
        const system = new System(this);
        this.Systems.add(System);
        await this.#startSystem(system);
        this.systems.push(system);
      }
    }
  }
  async insert(System: ISystemConstructor<any>, index = 0) {
    const system = new System(this);
    this.Systems.add(System);
    await this.#startSystem(system);
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
    for (const system of this.readySystems) {
      system.update(context);
    }
  }
  updateServices() {
    const { context } = this;
    for (const system of this.readySystems) {
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
        
        // Also remove from readySystems
        const readyIndex = this.readySystems.indexOf(system);
        if (readyIndex !== -1) {
          this.readySystems.splice(readyIndex, 1);
        }
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
    this.readySystems.length = 0;
  }
}
