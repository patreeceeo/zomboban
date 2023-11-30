import { listEntities } from "./Entity";

type Filter = (entityId: number) => boolean;

export function executeFilterQuery(
  fn: Filter,
  results: Array<number>,
): ReadonlyArray<number> {
  for (const entityId of listEntities()) {
    if (fn(entityId)) {
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
