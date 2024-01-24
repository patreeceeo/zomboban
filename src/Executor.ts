import { invariant } from "./Error";
import { emptyObject } from "./util";

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
    name: NewParamName,
    defaultValue: NewParamType,
  ): ExecutorBuilder<
    ExtendRecord<Params, NewParamName, NewParamType>,
    ReturnType
  > {
    return new ExecutorBuilder(this.name, {
      ...this.#params,
      [name]: defaultValue,
    } as ExtendRecord<Params, NewParamName, NewParamType>);
  }

  complete(
    fn: GenericFunction<[Params], ReturnType>,
  ): Executor<Params, ReturnType> {
    return new Executor(this.name, fn, { ...this.#params });
  }
}

export class Executor<Params extends Record<string, any>, ReturnType> {
  #fn: GenericFunction<[Params], ReturnType>;
  #params: Params;
  #hasArgs: Partial<{
    [paramName in keyof Params]: boolean;
  }>;
  #paramCount: number;
  #argCount = 0;
  static build<Params extends Record<string, any> = {}, ReturnType = void>(
    name: string,
  ) {
    return new ExecutorBuilder<Params, ReturnType>(name);
  }
  constructor(
    readonly name: string,
    fn: GenericFunction<[Params], ReturnType>,
    params: Params,
  ) {
    this.#fn = fn;
    this.#params = params;
    this.#hasArgs = {};
    this.#paramCount = Object.keys(params).length;
  }

  resetArgs() {
    emptyObject(this.#hasArgs);
    this.#argCount = 0;
  }

  setArg<ParamName extends keyof Params>(
    param: ParamName,
    value: Params[ParamName],
    override = false,
  ): Executor<Params, ReturnType> {
    const { name } = this;
    invariant(
      param in this.#params,
      `${name} does not have parameter: ${param.toString()}`,
    );
    invariant(
      !this.#hasArgs[param] || override,
      `${name} already has argument for parameter: ${param.toString()}`,
    );
    this.#params[param] = value;
    this.#hasArgs[param] = true;
    this.#argCount++;
    return this;
  }

  get paramCount() {
    return this.#paramCount;
  }

  checkArgs(expectCount: number): Executor<Params, ReturnType> {
    invariant(
      this.#argCount >= expectCount,
      `${this.name} is missing arguments. Has arguments: ${JSON.stringify(
        this.#hasArgs,
      )}`,
    );
    return this;
  }

  execute = (): ReturnType => {
    const result = this.#fn(this.#params);
    return result;
  };
}
