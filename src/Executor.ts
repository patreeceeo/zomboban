import { invariant } from "./Error";

type ExtendRecord<
  T extends Record<string, any>,
  NewKey extends string,
  NewValue,
> = T & Record<NewKey, NewValue>;

export type GenericFunction<Params extends Record<string, any>, ReturnType> = (
  params: Params,
) => ReturnType;

export class ExecutorBuilder<
  Params extends Record<string, any> = {},
  ReturnType = void,
> {
  #params: Params;
  constructor(
    readonly name: string,
    params = {} as Params,
  ) {
    this.#params = params;
  }

  addParam<NewParamType, NewParamName extends string>(
    param: NewParamName,
  ): ExecutorBuilder<
    ExtendRecord<Params, NewParamName, NewParamType>,
    ReturnType
  > {
    return new ExecutorBuilder(this.name, {
      ...this.#params,
      [param]: undefined,
    } as ExtendRecord<Params, NewParamName, NewParamType>);
  }

  complete(
    fn: GenericFunction<Params, ReturnType>,
  ): Executor<Params, ReturnType> {
    return new Executor(this.name, fn, { ...this.#params });
  }
}

export class Executor<Params extends Record<string, any>, ReturnType> {
  #fn: GenericFunction<Params, ReturnType>;
  #params: Params;
  #paramCount: number;
  #argCount = 0;
  static build<Params extends Record<string, any> = {}, ReturnType = void>(
    name: string,
  ) {
    return new ExecutorBuilder<Params, ReturnType>(name);
  }
  constructor(
    readonly name: string,
    fn: GenericFunction<Params, ReturnType>,
    params: Params,
  ) {
    this.#fn = fn;
    this.#params = params;
    this.#paramCount = Object.keys(this.#params).length;
  }

  setParam<ParamName extends keyof Params>(
    param: ParamName,
    value: Params[ParamName],
  ): Executor<Params, ReturnType> {
    const { name } = this;
    invariant(
      param in this.#params,
      `${name} does not have parameter: ${param.toString()}`,
    );
    invariant(
      this.#argCount < this.#paramCount,
      `${name} has too many arguments: ${JSON.stringify(this.#params)}`,
    );
    this.#params[param] = value;
    this.#argCount += 1;
    return this;
  }

  execute(): ReturnType {
    const { name } = this;
    invariant(
      this.#paramCount === this.#argCount,
      `${name} is missing arguments. Current arguments: ${JSON.stringify(
        this.#params,
      )}`,
    );
    const result = this.#fn(this.#params);
    this.#argCount = 0;
    return result;
  }
}
