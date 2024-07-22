import { Island, IslandElement } from "./Island";
import { ShowDirective } from "./ShowDirective";
import { HandleClickDirective } from "./HandleClickDirective";
import { Base } from "./Base";
import { ControllersByNodeMap } from "./collections";
import { Interpolator } from "./Interpolator";
import { createIslandElementConstructor } from "./functions/createIslandElementConstructor";

export * from "./Island";

export interface ZuiOptions {
  islands: Record<string, Island>;
  scope: any;
}

function documentReady(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === "loading") {
      // Loading hasn't finished yet
      document.addEventListener("DOMContentLoaded", resolve as any);
    } else {
      // `DOMContentLoaded` has already fired
      resolve();
    }
  });
}

export class Zui extends Base {
  #islandTagNames: string[];
  #controllersByElement = new ControllersByNodeMap();
  #promises = [] as Promise<any>[];
  #interpolator = new Interpolator(this.#controllersByElement);
  zShow = new ShowDirective("z-show");
  zClick = new HandleClickDirective("z-click");
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
        this.#controllersByElement.cascade(el);
        this.#interpolator.ingest(el);
      }
    };

    this.#promises.push(
      new Promise((resolve) => {
        requestAnimationFrame(resolve);
      })
    );

    this.hydrated().then(() => {
      this.#controllersByElement.cascade(root);
      this.#interpolator.ingest(root);
    });
  }
  hydrated() {
    return Promise.all(this.#promises);
  }
  ready() {
    return Promise.all([documentReady(), this.hydrated()]);
  }

  createCustomElementConstructor(island: Island): CustomElementConstructor {
    const { zShow, options } = this;
    const controllerMap = this.#controllersByElement;
    const globalPromises = this.#promises;
    return createIslandElementConstructor(
      island,
      controllerMap,
      isShowing,
      globalPromises
    );

    function isShowing(el: HTMLElement) {
      if (zShow.hasDirective(el)) {
        const scope = zShow.getScope(el, controllerMap, options.scope);
        return zShow.shouldShow(el, scope);
      }
      return true;
    }
  }

  update() {
    const { root, options } = this;
    const { scope } = options;
    const controllerMap = this.#controllersByElement;

    for (const maybeController of controllerMap.values()) {
      maybeController.awaitedValue?.updateScope(scope);
    }

    this.zShow.updateAllInstances(root, controllerMap, scope);
    this.zClick.updateAllInstances(root, controllerMap, scope);

    this.#interpolator.interpolate(scope);
  }
  isIsland(el: HTMLElement): el is IslandElement {
    return this.#islandTagNames.includes(el.tagName);
  }
  hydrateIsland(el: IslandElement) {
    return el.hydrate();
  }
}
