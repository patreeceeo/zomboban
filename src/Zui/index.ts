import htmx from "htmx.org";
import { invariant } from "../Error";
import { Island, IslandController } from "./Island";
import { ShowDirective } from "./ShowDirective";
import { HandleClickDirective } from "./HandleClickDirective";
import { AwaitedValue } from "../Monad";
import { Base } from "./Base";
import { ControllersByNodeMap } from "./collections";
import { Interpolator } from "./Interpolator";

export * from "./Island";

export interface ZuiOptions {
  islands: Record<string, Island>;
  state: any;
}

interface IslandElement extends HTMLElement {
  hydrate(): Promise<void>;
  isHydrated: boolean;
}

export class Zui extends Base {
  #islandTagNames: string[];
  #controllersByElement = new ControllersByNodeMap();
  #promises = [] as Promise<any>[];
  #resolvedPromise = Promise.resolve();
  #interpolator = new Interpolator(this.#controllersByElement);
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
    super();
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
    this.zShow.onShow = async (el) => {
      if (this.isIsland(el) && !el.isHydrated) {
        await this.hydrateIsland(el);
        this.#controllersByElement.updateInheritance(el);
        this.#interpolator.ingest(el);
      }
    };

    this.hydrated.then(() => {
      this.#controllersByElement.updateInheritance(root);
      this.#interpolator.ingest(root);
    });
  }
  get hydrated() {
    return Promise.all(this.#promises);
  }
  createCustomElementConstructor(island: Island): CustomElementConstructor {
    const { zShow, options } = this;
    const controllerMap = this.#controllersByElement;
    const globalPromises = this.#promises;
    const resolvedPromise = this.#resolvedPromise;
    // TODO factor into a stand-alone function?
    return class extends HTMLElement implements IslandElement {
      isHydrated = false;
      async connectedCallback() {
        const { templateHref } = island;

        this.setAttribute("template", templateHref);
        let isShowing = true;

        if (zShow.hasDirective(this)) {
          const scope = zShow.getScope(this, controllerMap, options.state);
          isShowing = zShow.shouldShow(this, scope);
        }

        if (isShowing) {
          await this.hydrate();
        }
      }

      async mount(importSpec: string) {
        controllerMap.set(this, new AwaitedValue());
        const { default: Clazz } = (await import(
          /* @vite-ignore */ importSpec
        )) as any;
        invariant(
          typeof Clazz === "function",
          "Expected default export to be a constructor"
        );
        const controller = new Clazz(this);
        invariant(
          controller instanceof IslandController,
          `Expected default export to be a subclass of ${IslandController.name}`
        );
        controllerMap.get(this)!.awaitedValue = controller;
      }

      async hydrate() {
        const { templateHref, mount } = island;
        const templatePromise = htmx.ajax("get", templateHref, this);

        invariant(
          mount === undefined || typeof mount === "string",
          `Expected island.mount to be a string or undefined, got ${mount}`
        );
        let mountPromise = resolvedPromise;
        if (mount !== undefined) {
          mountPromise = this.mount(mount);
        }

        globalPromises.push(templatePromise, mountPromise);

        await mountPromise;
        await templatePromise;
        this.isHydrated = true;
      }
    };
  }

  update() {
    const { root, options } = this;
    const { state } = options;
    const controllerMap = this.#controllersByElement;

    for (const maybeController of controllerMap.values()) {
      maybeController.awaitedValue?.updateScope(state);
    }

    this.zShow.updateAllInstances(root, controllerMap, state);
    this.zClick.updateAllInstances(root, controllerMap, state);

    this.#interpolator.interpolate(state);
  }
  isIsland(el: HTMLElement): el is IslandElement {
    return this.#islandTagNames.includes(el.tagName);
  }
  hydrateIsland(el: IslandElement) {
    return el.hydrate();
  }
}
