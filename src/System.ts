import { IReadonlyComponentDefinition } from "./Component";
import { IQueryResults } from "./Query";
import { QueryState } from "./state";

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

export function SystemQueryMixin<
  Base extends IConstructor<System<Context>>,
  Context extends QueryState
>(
  base: Base,
  queryDefMap: Record<string, IReadonlyComponentDefinition<any>[]>,
  assign: (
    self: InstanceType<Base>,
    queryResultsMap: Record<string, IQueryResults<any>>
  ) => void
) {
  return class extends base {
    constructor(...args: any[]) {
      super(...args);
    }
    start(context: Context) {
      const queryResultsMap = {} as Record<string, IQueryResults<any>>;
      for (const [queryName, components] of Object.entries(queryDefMap)) {
        queryResultsMap[queryName] = context.query(components);
      }
      assign(this as InstanceType<Base>, queryResultsMap);
      super.start(context);
    }
  };
}

type IQueryDefMap = Record<string, IReadonlyComponentDefinition<any>[]>;

// type IQueryResultsForDefMap<QueryDefMap extends IQueryDefMap> = {
//   [K in keyof QueryDefMap]: IQueryResults<QueryDefMap[K][number]>;
// };

export class SystemWithQueries<
  Context extends QueryState
> extends System<Context> {
  queryDefMap = {} as IQueryDefMap;
  constructor(readonly mgr = new SystemManager<Context>()) {
    super(mgr);
  }
  start(context: Context) {
    const queryResultsMap = {} as Record<string, IQueryResults<any>>;
    for (const [queryName, components] of Object.entries(this.queryDefMap)) {
      queryResultsMap[queryName] = context.query(components);
    }
    Object.assign(this, queryResultsMap);
    super.start(context);
  }
}
