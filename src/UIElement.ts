import { ObservableArray } from "./Observable";

export type RenderResult =
  | void
  | string
  | string[]
  | HTMLElement
  | HTMLElement[];

export interface UIElement<RenderData> {
  (data: RenderData): RenderResult;
}

class Pool<T> {
  items = [] as T[];
  used = [] as boolean[];
  index = 0;
  size = 0;
  usedCount = 0;
  constructor(readonly ffn: () => T) {}
  acquire(): T {
    const { items, used } = this;
    let { index, size } = this;
    index = this.index = (index + 1) % size;
    const item = items[index]!;
    items[index] = item;
    used[index] = true;
    return item;
  }
  // TODO expand pool automatically
  expand(amount: number) {
    const { ffn } = this;
    for (let i = this.index, j = 0; j < amount; i++, j++) {
      this.items.splice(i, 0, ffn());
    }
    this.size += amount;
  }
  release(item: T) {
    const { items, used } = this;
    const index = items.indexOf(item);
    used[index] = false;
    this.usedCount--;
  }
}

const elPools = new Map<string, Pool<HTMLElement>>();
const textNodePool = new Pool(() => new Text());

export function releaseElement(node: Node) {
  if (node instanceof HTMLElement) {
    const pool = elPools.get(node.tagName)!;
    pool.release(node);
    for (const child of node.children) {
      releaseElement(child as HTMLElement);
    }
  } else if (node instanceof Text) {
    textNodePool.release(node);
  }
}

export interface INativeUIElementProps {
  tagName: string;
  className?: string;
  children?: () => RenderResult;
}

export function NativeUIElement(data: INativeUIElementProps) {
  const { tagName, className } = data;
  const pool =
    elPools.get(tagName) ?? new Pool(() => document.createElement(tagName));
  if (pool.size === 0) {
    pool.expand(200);
  }
  const el = pool.acquire();

  el.className = className ?? "";

  const children = data.children ? data.children() : undefined;

  addToDOM(el, children);

  pool.items.push(el);
  elPools.set(tagName, pool);

  return el;
}

export class UIElementArrayOptions {
  constructor(
    readonly maxLength = Infinity,
    readonly reverse = false
  ) {}
}

const defaultOptions = new UIElementArrayOptions();

export class UIElementArray<RenderDataItem> {
  #itemToElement = new Map<RenderDataItem, HTMLElement>();
  #elementToItem = new Map<HTMLElement, RenderDataItem>();
  #clippedItems = [] as RenderDataItem[];
  constructor(
    readonly root: HTMLElement,
    readonly renderItem: (data: RenderDataItem) => HTMLElement,
    readonly options = defaultOptions
  ) {}
  removeChild(
    element: HTMLElement,
    item: RenderDataItem = this.#elementToItem.get(element)!
  ) {
    element.remove();
    releaseElement(element);
    this.#itemToElement.delete(item);
    this.#elementToItem.delete(element);
  }
  addChild(item: RenderDataItem) {
    const { root, options } = this;
    const element = this.renderItem(item);
    this.#itemToElement.set(item, element);
    this.#elementToItem.set(element, item);
    if (options.reverse) {
      root.prepend(element);
    } else {
      root.append(element);
    }
  }
  subscribe(array: ObservableArray<RenderDataItem>) {
    array.stream((item) => {
      const { root, options } = this;
      const { children } = root;
      this.addChild(item);
      const childrenLength = children.length;
      for (let i = options.maxLength; i < childrenLength; i++) {
        const element = children.item(i) as HTMLElement;
        this.#clippedItems.push(this.#elementToItem.get(element)!);
        this.removeChild(element);
      }
    });
    array.onRemove((item) => {
      const element = this.#itemToElement.get(item);
      const clippedItems = this.#clippedItems;
      const { root, options } = this;
      const { maxLength } = options;
      if (element) {
        this.removeChild(element, item);
      }
      for (
        let i = root.children.length;
        i < maxLength && clippedItems.length > 0;
        i++
      ) {
        this.addChild(clippedItems.pop()!);
      }
    });
  }
}

function addToDOM(parent: HTMLElement, result: RenderResult) {
  if (result) {
    if (result instanceof Array) {
      for (const item of result) {
        addToDOM(parent, item);
      }
    } else if (typeof result === "string") {
      if (textNodePool.size === 0) {
        textNodePool.expand(200);
      }
      const text = textNodePool.acquire();
      text.textContent = result;
      parent.appendChild(text);
    } else {
      parent.appendChild(result);
    }
  }
}
