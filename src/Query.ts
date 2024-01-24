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
  complete(
    fn: GenericFunction<[Params], boolean>,
  ): Query<WithEntityId<Params>> {
    return new Query(this.#builder.complete(fn));
  }
}

export class Query<Params extends WithEntityId<Record<string, any>>> {
  #executor: Executor<Params, boolean>;
  #results: number[] = [];
  static build(name: string) {
    return new QueryBuilder(name);
  }
  constructor(executor: Executor<Params, boolean>) {
    this.#executor = executor;
  }
  setParam<ParamName extends keyof Params>(
    param: ParamName,
    value: Params[ParamName],
  ): Query<Params> {
    this.#executor.setArg(param, value);
    return this;
  }
  execute(): IterableIterator<number> {
    const results = this.#results;
    const executor = this.#executor;
    const execute = executor.execute;
    executor.checkArgs(executor.paramCount - 1);
    results.length = 0;
    for (const entityId of listEntities()) {
      executor.setArg("entityId", entityId, true);
      if (entityId !== undefined && execute()) {
        results.push(entityId);
      }
    }
    executor.resetArgs();
    return results.values();
  }
}
