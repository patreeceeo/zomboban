import htmx from "htmx.org";
import { invariant } from "../Error";
import { Island, IslandController } from "./Island";

export * from "./Island";

function getBooleanAttribute(
  el: HTMLElement,
  attrName: string,
  defaultValue: boolean
) {
  const value = el.getAttribute(attrName);
  return value !== null ? value === "true" : defaultValue;
}

function setBooleanAttribute(
  el: HTMLElement,
  attrName: string,
  value: boolean
) {
  el.setAttribute(attrName, String(value));
}

const xShow = {
  attribute: "x-show",
  get selector() {
    return `[${this.attribute}]`;
  },
  show(el: HTMLElement, value: boolean) {
    setBooleanAttribute(el, "x-show-computed", value);
    if (value) {
      htmx.removeClass(el, "vh");
    } else {
      htmx.addClass(el, "vh");
    }
  },
  shouldShow(el: HTMLElement, state: any) {
    const hasProp = el.hasAttribute("x-show");
    const prop = el.getAttribute("x-show")!;

    return hasProp ? !!state[prop] : true;
  },
  wasShowing(el: HTMLElement) {
    return getBooleanAttribute(el, "x-show-computed", true);
  },
  update(el: HTMLElement, state: any) {
    const showEls = htmx.findAll(el, this.selector);

    for (const el of showEls) {
      if (el instanceof HTMLElement) {
        const shouldShow = this.shouldShow(el, state);
        const wasShowing = this.wasShowing(el);
        this.show(el, shouldShow);
        if (shouldShow && !wasShowing) {
          this.onShow(el);
        }
      }
    }
  },
  onShow: (_el: HTMLElement) => {}
};

export interface XUIOptions {
  islands: Record<string, Island>;
  state: any;
}

interface IslandElement extends HTMLElement {
  hydrate(): Promise<void>;
  isHydrated: boolean;
}

export class XUI {
  #islandsByRootElement = new Map<HTMLElement, typeof IslandController>();
  #islandTagNames: string[];
  static ready(callback: () => void) {
    if (document.readyState === "loading") {
      // Loading hasn't finished yet
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      // `DOMContentLoaded` has already fired
      callback();
    }
  }
  constructor(
    readonly root: HTMLElement,
    readonly options: XUIOptions
  ) {
    const { islands } = options;
    // Tag names return by the DOM API are always uppercase
    this.#islandTagNames = Array.from(Object.keys(islands)).map((name) =>
      name.toUpperCase()
    );
    for (const [name, island] of Object.entries(islands)) {
      window.customElements.define(
        name,
        this.createCustomElementConstructor(island)
      );
    }
    xShow.onShow = (el) => {
      if (this.isIsland(el) && !el.isHydrated) {
        this.hydrateIsland(el);
      }
    };
  }
  createCustomElementConstructor(island: Island): CustomElementConstructor {
    const controllerMap = this.#islandsByRootElement;
    const { state } = this.options;
    return class extends HTMLElement implements IslandElement {
      isHydrated = false;
      async connectedCallback() {
        const { templateHref } = island;

        const isShowing = xShow.shouldShow(this, state);

        this.setAttribute("template", templateHref);

        if (isShowing) {
          this.hydrate();
        }
      }
      async hydrate() {
        const { templateHref } = island;
        const ControllerKlass =
          controllerMap.get(this) ?? (await island.loadControllerKlass());

        invariant(
          typeof ControllerKlass === "function",
          "Expected default export to be a constructor"
        );
        await htmx.ajax("get", templateHref, this);
        new ControllerKlass(this);
        controllerMap.set(this, ControllerKlass);
        this.isHydrated = true;
      }
    };
  }

  update() {
    xShow.update(this.root, this.options.state);
  }
  isIsland(el: HTMLElement): el is IslandElement {
    return this.#islandTagNames.includes(el.tagName);
  }
  hydrateIsland(el: IslandElement) {
    el.hydrate();
  }
}
