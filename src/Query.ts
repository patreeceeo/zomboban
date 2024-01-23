import { listEntities } from "./Entity";
import { invariant } from "./Error";

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

type FilterFn<Params extends Record<string, any>> = (
  params: Params,
) => (entityId: number) => boolean;

class QueryBuilder<Params extends Record<string, any> = {}> {
  #params: Params;
  constructor(params = {} as Params) {
    this.#params = params;
  }

  addParam<NewParamType, NewParamName extends string>(
    param: NewParamName,
  ): QueryBuilder<ExtendRecord<Params, NewParamName, NewParamType>> {
    return new QueryBuilder({
      ...this.#params,
      [param]: undefined,
    } as ExtendRecord<Params, NewParamName, NewParamType>);
  }

  complete(filter: FilterFn<Params>): Query<Params> {
    return new Query(filter, { ...this.#params });
  }
}

export class Query<Params extends Record<string, any>> {
  #filter: FilterFn<Params>;
  #params: Params;
  #paramCount: number;
  #argCount = 0;
  #results: Array<number> = [];
  static build() {
    return new QueryBuilder();
  }
  constructor(filter: FilterFn<Params>, params: Params) {
    this.#filter = filter;
    this.#params = params;
    this.#paramCount = Object.keys(this.#params).length;
  }

  setParam<ParamName extends keyof Params>(
    param: ParamName,
    value: Params[ParamName],
  ): Query<Params> {
    invariant(
      param in this.#params,
      `Query does not have parameter: ${param.toString()}`,
    );
    invariant(
      this.#argCount < this.#paramCount,
      `Query has too many arguments: ${JSON.stringify(this.#params)}`,
    );
    this.#params[param] = value;
    this.#argCount += 1;
    return this;
  }

  execute(): IterableIterator<number> {
    invariant(
      this.#paramCount === this.#argCount,
      `Query is missing arguments. Current arguments: ${JSON.stringify(
        this.#params,
      )}`,
    );
    this.#results = [];
    for (const entityId of listEntities()) {
      if (entityId !== undefined && this.#filter(this.#params)(entityId)) {
        this.#results.push(entityId);
      }
    }
    this.#argCount = 0;
    return this.#results.values();
  }
}
