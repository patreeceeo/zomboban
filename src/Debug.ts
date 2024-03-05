import { invariant } from "./Error";
import { BehaviorComponent } from "./components";
import { stateOld } from "./state";

export function getStackTrace(omitLines = 2) {
  const stack = new Error().stack;
  return stack !== undefined
    ? `\n${stack.split("\n").slice(omitLines).join("\n")}`
    : "(No stack trace)";
}

export function logWithStackTrace(...args: any[]) {
  console.log("", ...args, getStackTrace(3));
}

export function humanizeEntity(entityId: number) {
  return `${stateOld.get(BehaviorComponent, entityId)} (${entityId})`;
}

const _debugAliases = new WeakMap<any, string>();
export function setDebugAlias<O extends Record<string | number | symbol, any>>(
  object: O,
  name: string,
  overwrite = false
) {
  const existingAlias = getDebugAlias(object);
  invariant(
    existingAlias === undefined || overwrite,
    `Alias already set: ${existingAlias}`
  );
  _debugAliases.set(object, name);
}

export function getDebugAlias(object: any) {
  return _debugAliases.get(object);
}
