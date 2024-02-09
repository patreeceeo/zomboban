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
  static build(name: string) {
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
      if (entityId !== undefined && execute()) {
        results.push(entityId);
      }
    }
    executor.resetArgs();
    return results;
  };
}
