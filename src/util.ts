import _ from "lodash";
import * as fflate from "fflate";

export function afterDOMContentLoaded(callback: () => void): void {
  if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    // `DOMContentLoaded` has already fired
    callback();
  }
}

interface ThrottleInputFunction<TArgs extends any[], TReturn extends any> {
  (...args: TArgs): TReturn;
}
interface ThrottleOutputFunction<TArgs extends any[], TReturn extends any> {
  (...args: TArgs): TReturn | undefined;
  cancel(): void;
  flush(): TReturn | undefined;
}

const throttleOptions = {
  leading: true,
  trailing: false
} as _.ThrottleSettings;
export function throttle<TArgs extends any[], TReturn extends any>(
  callback: ThrottleInputFunction<TArgs, TReturn>,
  delay: number,
  options = throttleOptions
): ThrottleOutputFunction<TArgs, TReturn> {
  return _.throttle(callback, delay, options);
}

export function deflateString(str: string) {
  const enc = new TextEncoder();
  const u8array = enc.encode(str);
  return fflate.zlibSync(u8array);
}

export function inflateString(data: Uint8Array) {
  const inflated = fflate.unzlibSync(data);
  return String.fromCharCode(...inflated);
}

export function awaitDefaultExport<T>(
  promise: Promise<{ default: T }>
): () => Promise<T> {
  return () => promise.then((m) => m.default);
}

export function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function when(callback: () => boolean) {
  while (!callback()) {
    await nextTick();
  }
}

export function emptyObject<T extends Record<string | number | symbol, any>>(
  obj: T
) {
  for (const key in obj) {
    delete obj[key];
  }
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
) {
  return _.pick(obj, keys);
}

/** function that takes any object and returns an object with setter traps for each property, recursively.
 */
export function makeReadonlyRecursively<T extends Record<string, any>>(
  obj: T
): T {
  const result = {} as T;
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      result[key] = makeReadonlyRecursively(obj[key]);
    } else {
      result[key] = obj[key];
    }
  }
  return new Proxy(result, {
    set() {
      throw new Error("Cannot write to read-only object");
    }
  });
}

export type ReadonlyDeep<T> =
  T extends Record<string, any>
    ? Readonly<{ [Key in keyof T]: ReadonlyDeep<T[Key]> }>
    : T;

export function isNumber(value: any): value is number {
  return typeof value === "number" && !isNaN(value);
}

// TODO test
export function joinPath(...parts: string[]) {
  // ensure there's no duplicate slashes
  const nonEmptyParts = [];
  for (const part of parts) {
    if (part !== "") {
      nonEmptyParts.push(part);
    }
  }
  return nonEmptyParts.join("/").replace(/\/+/g, "/");
}
