type ExtendRecord<
  T extends Record<string, any>,
  NewKey extends string,
  NewValue,
> = T & Record<NewKey, NewValue>;

type GenericFunction<Params extends Record<string, any>, ReturnType> = (
  params: Params,
) => ReturnType;
