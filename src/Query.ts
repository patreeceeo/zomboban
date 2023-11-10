type Filter = (entityId: number) => boolean;
export type ComplexFilter<RestArgs extends Array<number>> = {
  fn: (entityId: number, ...args: RestArgs) => boolean;
  restArgs: RestArgs;
};

const ALL_ENTITIES: Array<number> = [];

export function registerEntity(entityId: number): void {
  ALL_ENTITIES[entityId] = entityId;
}

export function executeFilterQuery(
  fn: Filter,
  results: Array<number>,
): ReadonlyArray<number> {
  for (let i = 0; i < ALL_ENTITIES.length; i++) {
    const entityId = ALL_ENTITIES[i];
    if (fn(entityId)) {
      results.push(entityId);
    }
  }
  return results;
}

export function executeComplexFilterQuery<RestArgs extends Array<number>>(
  filter: ComplexFilter<RestArgs>,
  results: Array<number>,
): Array<number> {
  for (let i = 0; i < ALL_ENTITIES.length; i++) {
    const entityId = ALL_ENTITIES[i];
    if (filter.fn(entityId, ...filter.restArgs)) {
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
  return (...args: Args) => {
    for (const fn of fns) {
      if (!fn(...args)) {
        return false;
      }
    }
    return true;
  };
}
