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
  trailing: false,
};
export function throttle<TArgs extends any[], TReturn extends any>(
  callback: ThrottleInputFunction<TArgs, TReturn>,
  delay: number,
): ThrottleOutputFunction<TArgs, TReturn> {
  return _.throttle(callback, delay, throttleOptions);
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
  promise: Promise<{ default: T }>,
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
  obj: T,
) {
  for (const key in obj) {
    delete obj[key];
  }
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
) {
  return _.pick(obj, keys);
}
