import _ from "lodash";
import * as fflate from "fflate";
import { Vector2 } from "./Three";

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

export function once(
  callback: () => void,
  cleanup: (callback: () => void) => void
) {
  let called = false;
  return () => {
    if (!called) {
      called = true;
      callback();
    } else {
      cleanup(callback);
    }
  };
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const PI2 = Math.PI * 2;
// keep angle between 0 and 2PI
export function normalizeAngle(angle: number) {
  return (angle + PI2) % PI2;
}

export function createTrapVector2() {
  const vector2 = new Vector2() as Vector2 & { _x: number; _y: number };
  Object.defineProperties(vector2, {
    x: {
      set(value) {
        vector2._x = value;
      },
      get() {
        return vector2._x;
      }
    },
    y: {
      set(value) {
        vector2._y = value;
      },
      get() {
        return vector2._y;
      }
    }
  });
  return vector2;
}

import {
  Log,
  LogSubject,
  LogToConsoleAdaptor,
  LogToMemoryAdaptor
} from "./Log";

export const log = new Log();
log.addAdaptor(new LogToMemoryAdaptor());
log.addAdaptor(new LogToConsoleAdaptor());

export function logEntityErrors(entity: any) {
  const adaptors = log.getAdaptors(LogToMemoryAdaptor);
  for (const adaptor of adaptors) {
    const entries = adaptor.filter({
      subjects: [new LogSubject(entity)]
    });
    for (const entry of entries) {
      console.log(entry.toString());
    }
  }
}
