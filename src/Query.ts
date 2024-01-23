import { listEntities } from "./Entity";
import { Executor, ExecutorBuilder, GenericFunction } from "./Executor";

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

type ExtendRecord<
  T extends Record<string, any>,
  NewKey extends string,
  NewValue,
> = T & Record<NewKey, NewValue>;

type FilterFn = (entityId: number) => boolean;

class QueryBuilder<Params extends Record<string, any> = {}> {
  #functorBuilder: ExecutorBuilder<Params, FilterFn>;
  constructor(
    readonly name: string,
    functorBuilder = Executor.build<Params, FilterFn>(`${name} Query`),
  ) {
    this.#functorBuilder = functorBuilder;
  }
  addParam<NewParamType, NewParamName extends string>(
    param: NewParamName,
  ): QueryBuilder<ExtendRecord<Params, NewParamName, NewParamType>> {
    return new QueryBuilder(
      this.name,
      this.#functorBuilder.addParam<NewParamType, NewParamName>(param),
    );
  }
  complete(fn: GenericFunction<Params, FilterFn>): Query<Params> {
    return new Query(this.#functorBuilder.complete(fn));
  }
}

export class Query<Params extends Record<string, any>> {
  #functor: Executor<Params, FilterFn>;
  #results: Array<number> = [];
  static build(name: string) {
    return new QueryBuilder(name);
  }
  constructor(functor: Executor<Params, FilterFn>) {
    this.#functor = functor;
  }
  setParam<ParamName extends keyof Params>(
    param: ParamName,
    value: Params[ParamName],
  ): Query<Params> {
    this.#functor.setParam(param, value);
    return this;
  }
  execute(): IterableIterator<number> {
    const results = this.#results;
    results.length = 0;
    const filter = this.#functor.execute();
    for (const entityId of listEntities()) {
      if (entityId !== undefined && filter(entityId)) {
        this.#results.push(entityId);
      }
    }
    return this.#results.values();
  }
}
