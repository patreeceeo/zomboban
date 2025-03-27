import _ from "lodash";
import { Vector2 } from "./Three";

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

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
