import htmx from "htmx.org";
import { invariant } from "../Error";
import { Island } from "./Island";
import { ShowDirective } from "./ShowDirective";
import { HandleClickDirective } from "./HandleClickDirective";

export * from "./Island";

export interface ZuiOptions {
  islands: Record<string, Island>;
  state: any;
}

interface IslandElement extends HTMLElement {
  hydrate(): Promise<void>;
  isHydrated: boolean;
}

export class Zui {
  #islandTagNames: string[];
  zShow = new ShowDirective("z-show");
  zClick = new HandleClickDirective("z-click");
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
    readonly options: ZuiOptions
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
    this.zShow.onShow = (el) => {
      if (this.isIsland(el) && !el.isHydrated) {
        this.hydrateIsland(el);
      }
    };
  }
  createCustomElementConstructor(island: Island): CustomElementConstructor {
    const { state } = this.options;
    const { zShow } = this;
    return class extends HTMLElement implements IslandElement {
      isHydrated = false;
      async connectedCallback() {
        const { templateHref } = island;

        const isShowing = zShow.hasDirective(this)
          ? zShow.shouldShow(this, state)
          : true;

        this.setAttribute("template", templateHref);

        if (isShowing) {
          this.hydrate();
        }
      }

      async mount(importSpec: string) {
        const { default: Clazz } = (await import(
          /* @vite-ignore */ importSpec
        )) as any;
        invariant(
          typeof Clazz === "function",
          "Expected default export to be a constructor"
        );
        new Clazz(this);
      }

      async hydrate() {
        const { templateHref, mount } = island;

        await htmx.ajax("get", templateHref, this);

        invariant(
          mount === undefined || typeof mount === "string",
          `Expected island.mount to be a string or undefined, got ${mount}`
        );
        if (mount !== undefined) {
          this.mount(mount);
        }
        this.isHydrated = true;
      }
    };
  }

  update() {
    const { root, options } = this;
    const { state } = options;
    this.zShow.updateAllInstances(root, state);
    this.zClick.updateAllInstances(root, state);
  }
  isIsland(el: HTMLElement): el is IslandElement {
    return this.#islandTagNames.includes(el.tagName);
  }
  hydrateIsland(el: IslandElement) {
    el.hydrate();
  }
}
