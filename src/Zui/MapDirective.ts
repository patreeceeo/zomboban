import { invariant } from "../Error";
import { AttributeDirective } from "./AttributeDirective";

class ElementClone {
  children = [] as Element[];
  constructor(
    el: Element | ElementClone,
    readonly key?: any
  ) {
    // Cloning like this instead of using el.cloneNode(true)
    // because Element has special behavior for preventing
    // any other Element from being both its child and another
    // Element's child, making it impossible to maintain a
    // deep copy of the original node when its children get
    // added to the document.

    const { children } = this;
    for (const child of el.children) {
      children.push(child.cloneNode(true) as Element);
    }
  }
  clone(key?: any) {
    return new ElementClone(this, key);
  }
}

class ElementData {
  clonesByKey = new Map<any, ElementClone>();
  original: ElementClone;
  constructor(source: Element) {
    this.original = new ElementClone(source);
  }

  cloneOriginal(key: any) {
    invariant(!this.clonesByKey.has(key), `Duplicate element key: ${key}`);
    return new ElementClone(this.original, key);
  }

  getClone(key: any) {
    return this.clonesByKey.get(key);
  }

  setClone(key: any, clone: ElementClone) {
    this.clonesByKey.set(key, clone);
  }

  removeClone(key: any) {
    this.clonesByKey.delete(key);
  }

  get cloneCount() {
    return this.clonesByKey.size;
  }

  #keys = new Set();

  recordKeys(keys: Iterable<any>) {
    this.#keys.clear();
    for (const key of keys) {
      this.#keys.add(key);
    }
  }

  #removedKeys = new Set();
  recordPreviousKeys(keys: Iterable<any>) {
    this.#removedKeys.clear();
    for (const key of keys) {
      this.#removedKeys.add(key);
    }
  }

  get keys() {
    return this.#keys;
  }

  get removedKeys() {
    return this.#removedKeys;
  }
}

export class MapDirective extends AttributeDirective {
  #elementMap = new Map<HTMLElement, ElementData>();
  attrNameAs = `${this.attrName}-as`;
  onAppend = (el: Element, data: any, scopeKey: string) => {
    void el, data, scopeKey;
  };
  onRemove = (el: Element) => {
    void el;
  };
  update(el: HTMLElement, scope: any): void {
    const elementMap = this.#elementMap;
    const attrValueData = this.getAttrValue(el);
    const attrValueAs = this.getAttrValue(el, this.attrNameAs);
    const data = this.evaluate(scope, attrValueData);

    invariant(
      Symbol.iterator in data,
      `Expected ${attrValueData} to be iterable`
    );

    let elData = elementMap.get(el);
    if (elData === undefined) {
      elData = new ElementData(el);
      elementMap.set(el, elData);
      el.replaceChildren();
    }

    elData.recordKeys(data);

    const { keys, removedKeys } = elData;
    const { cloneCount } = elData;

    let dataIndex = 0;

    for (const key of keys) {
      if (dataIndex >= cloneCount) {
        const clone = elData.cloneOriginal(key);
        elData.setClone(key, clone);
        for (const child of clone.children) {
          el.append(child);
          this.onAppend(child, key, attrValueAs);
        }
      }

      removedKeys.delete(key);

      dataIndex++;
    }

    for (const item of removedKeys) {
      const clone = elData.getClone(item);
      invariant(
        clone !== undefined,
        `Could not remove ${ElementClone.name}: Nothing found for key ${item}`
      );
      for (const child of clone.children) {
        child.remove();
        this.onRemove(child);
      }
      elData.removeClone(item);
    }

    // TODO how to handle keys being re-arranged?

    elData.recordPreviousKeys(data);
  }
}
