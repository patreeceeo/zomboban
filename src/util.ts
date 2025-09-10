import _ from "lodash";
import { Vector2 } from "three";
import { AnimationJson } from "./Animation";

export function isNumber(value: any): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function setAnimationClip(entity: { animation: any }, clipName: string): void {
  entity.animation.clipIndex = AnimationJson.indexOfClip(entity.animation, clipName);
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
import {invariant} from "./Error";

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


export const isClient = globalThis.document !== undefined

/**
 * Utility function to allow microtasks to run in tests.
 * Useful for testing async behavior.
 */
export function runMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export function minMax(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const emptySet = new Set<any>() as ReadonlySet<any>;

const svgTagNames = [
  'svg', 'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline',
  'rect', 'text', 'g', 'defs', 'use', 'symbol', 'image'
];
function isSvgTagName(tagName: string): boolean {
  return svgTagNames.includes(tagName);
}

interface ElementAttributes {
  id?: string;
  class?: string;
  style?: Partial<Record<keyof CSSStyleDeclaration, string>>;
  [key: string]: any; // Allow any other attributes
}

/**
  * Utility function to create an Element with attributes and children.
  */
export function el(tagName: string, attributes: ElementAttributes = {}, children: (string | Element)[] = []): Element {
  const ns = isSvgTagName(tagName) ? 'http://www.w3.org/2000/svg' : 'http://www.w3.org/1999/xhtml';
  const element = document.createElementNS(ns, tagName);
  const attributeEntries = Object.entries(attributes);

  for(const [key, value] of attributeEntries) {
    if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class') {
      element.className = value;
    } else if (key === 'style') {
      invariant(element instanceof HTMLElement, 'Element does not support style property');
      for (const [styleKey, styleValue] of Object.entries(value)) {
        element.style[styleKey as any] = styleValue as string;
      }
    } else if (key === 'ref') {
      /** @type Ref */(value).value = element; // For React-like ref handling
    } else if (key === 'innerHTML') {
      element.innerHTML = value; // Use innerHTML for raw HTML content
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}
