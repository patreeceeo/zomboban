import { listEntities } from "./Entity";
import { Executor, ExecutorBuilder } from "./Executor";

type Filter = (entityId: number) => boolean;

export function executeFilterQuery(
  fn: Filter,
  results: Array<number>,
  entityIds = listEntities(),
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

type FilterFn = (entityId: number) => boolean;

class QueryBuilder<Params extends Record<string, any> = {}> {
  #builder: ExecutorBuilder<Params, FilterFn>;
  constructor(
    readonly name: string,
    functorBuilder = Executor.build<Params, FilterFn>(`${name} Query`),
  ) {
    this.#builder = functorBuilder;
  }
  addParam<NewParamType, NewParamName extends string>(
    name: NewParamName,
    defaultValue: NewParamType,
  ): QueryBuilder<ExtendRecord<Params, NewParamName, NewParamType>> {
    return new QueryBuilder(
      this.name,
      this.#builder.addParam(name, defaultValue),
    );
  }
  complete(fn: GenericFunction<Params, FilterFn>): Query<Params> {
    return new Query(this.#builder.complete(fn));
  }
}

export class Query<Params extends Record<string, any>> {
  #executor: Executor<Params, FilterFn>;
  #results: Array<number> = [];
  static build(name: string) {
    return new QueryBuilder(name);
  }
  constructor(functor: Executor<Params, FilterFn>) {
    this.#executor = functor;
  }
  setParam<ParamName extends keyof Params>(
    param: ParamName,
    value: Params[ParamName],
  ): Query<Params> {
    this.#executor.setParam(param, value);
    return this;
  }
  execute(allowDefaultValues = false): IterableIterator<number> {
    const results = this.#results;
    results.length = 0;
    const filter = this.#executor.execute(allowDefaultValues);
    for (const entityId of listEntities()) {
      if (entityId !== undefined && filter(entityId)) {
        results.push(entityId);
      }
    }
    return results.values();
  }
}
