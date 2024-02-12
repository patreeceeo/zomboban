import { ComponentBase } from "./Component";
import { Executor, ExecutorBuilder } from "./Executor";

type Filter = (entityId: number) => boolean;

/** @deprecated */
export function executeFilterQuery(
  fn: Filter,
  results: Array<number>,
  entityIds: Enumerable<number>,
): ReadonlyArray<number> {
  for (const entityId of entityIds) {
    if (entityId !== undefined && fn(entityId)) {
      results.push(entityId);
    }
  }
  return results;
}

export function not<Args extends any[]>(
  fn: (...args: Args) => boolean,
): (...args: Args) => boolean {
  return (...args: Args) => !fn(...args);
}

export function and<Args extends any[]>(
  ...fns: Array<(...args: Args) => boolean>
): (...args: Args) => boolean {
  return (...args: Args) => fns.every((fn) => fn(...args));
}

type WithEntityId<Params extends Record<string, any>> = Params & {
  entityId: number;
};

class QueryBuilder<Params extends Record<string, any> = {}> {
  #builder: ExecutorBuilder<WithEntityId<Params>, boolean>;
  constructor(
    readonly name: string,
    builder = Executor.build<Params, boolean>(`${name} Query`),
  ) {
    this.#builder = builder.addParam("entityId", 0);
  }
  addParam<NewParamType, NewParamName extends string>(
    name: NewParamName,
    defaultValue: NewParamType,
  ): QueryBuilder<
    ExtendRecord<WithEntityId<Params>, NewParamName, NewParamType>
  > {
    return new QueryBuilder(
      this.name,
      this.#builder.addParam(name, defaultValue),
    );
  }
  complete(fn: GenericFunction<[WithEntityId<Params>], boolean>) {
    const q = new Query(this.#builder.complete(fn));
    return Object.assign(q.execute, q);
  }
}

// TODO add some methods for adding components, which would mean that the query would check if the entity has the component. That will make writing queries easier and make it possible to do some performance optimizations.

export class Query<Params extends WithEntityId<Record<string, any>>> {
  #executor: Executor<Params, boolean>;
  #results: number[] = [];
  static build(name = "Anonymous") {
    return new QueryBuilder(name);
  }
  constructor(executor: Executor<Params, boolean>) {
    this.#executor = executor;
  }
  setParam = <ParamName extends keyof Params>(
    param: ParamName,
    value: Params[ParamName],
  ): Query<Params> => {
    this.#executor.setArg(param, value);
    return this;
  };
  execute = (entities: Enumerable<number>): Enumerable<number> => {
    const results = this.#results;
    const executor = this.#executor;
    const execute = executor.execute;
    executor.checkArgs(executor.paramCount - 1);
    results.length = 0;
    for (const entityId of entities) {
      executor.setArg("entityId", entityId, true);
      if (execute()) {
        results.push(entityId);
      }
    }
    executor.resetArgs();
    return results;
  };
}

// TODO use component dictionary so you can pass constructors instead
export class ComponentFilter {
  #results = new Set<number>();
  #components = [] as ComponentBase<any, any, any>[];
  get components() {
    return this.#components;
  }
  constructor(components: ComponentBase<any, any, any>[]) {
    this.#components = components.sort((a, b) =>
      a.constructor.name > b.constructor.name ? 1 : -1,
    );
  }
  equals(filter: ComponentFilter) {
    for (let i = 0; i < this.#components.length; i++) {
      if (this.#components[i] !== filter.#components[i]) {
        return false;
      }
    }
    return true;
  }
  test(entityId: number) {
    return this.#components.every((c) => c.has(entityId));
  }
  handleAdd(entityId: number) {
    if (this.test(entityId)) {
      this.#results.add(entityId);
    }
  }
  handleRemove(entityId: number) {
    if (!this.test(entityId)) {
      this.#results.delete(entityId);
    }
  }
  get results(): Enumerable<number> {
    return this.#results;
  }
}

export class ComponentFilterRegistry {
  #array: ComponentFilter[] = [];
  register(filter: ComponentFilter) {
    const filters = this.#array;
    const index = filters.indexOf(filter);
    if (index === -1) {
      filters.push(filter);
      return filters.length - 1;
    }
    return index;
  }
  get(index: number) {
    return this.#array[index];
  }
  has(index: number) {
    return index >= 0 && index < this.#array.length;
  }
  values() {
    return this.#array as Enumerable<ComponentFilter>;
  }
}

// TODO use a tree structure to improve performance?
// const QueryTree = {
//   AComponent: {
//     queries: [
//       {
//         query:
//           ['AComponent', 'BComponent'],
//         queries: [
//           {
//             query:
//               ['AComponent', 'BComponent', 'CComponent'],
//             queries: []
//           },
//           {
//             query:
//               ['AComponent', 'BComponent', 'DComponent'],
//             queries: []
//           },
//         ]
//       },
//       {
//         query:
//           ['AComponent', 'CComponent'],
//         queries: []
//       },
//       {
//         query:
//           ['AComponent', 'DComponent'],
//         queries: []
//       },
//     ]
//   }
// }
