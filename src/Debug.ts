import { getActLike } from "./components/ActLike";

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
  return `${getActLike(entityId)} (${entityId})`;
}
