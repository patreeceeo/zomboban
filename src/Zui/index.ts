import { Island, IslandController, IslandElement } from "./Island";
import { ShowDirective } from "./ShowDirective";
import { HandleClickDirective } from "./HandleClickDirective";
import { Evaluator } from "./Evaluator";
import { ControllersByNodeMap } from "./collections";
import { Interpolator } from "./Interpolator";
import { createIslandElementConstructor } from "./functions/createIslandElementConstructor";
import { MapDirective } from "./MapDirective";
import { AwaitedValue } from "../Monad";
import { Observable } from "../Observable";
import { invariant } from "../Error";

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

export class Zui extends Evaluator {
  #islandTagNames: string[];
  #controllersByElement = new ControllersByNodeMap();
  #controllers = new Set<IslandController>();
  #customElementConnectedObservable = new Observable<Element>();
  #interpolator = new Interpolator(this.#controllersByElement);
  zShow = new ShowDirective("z-show");
  zClick = new HandleClickDirective("z-click");
  zMap = new MapDirective("z-map");
  constructor(
    readonly root: HTMLElement,
    readonly options: ZuiOptions
  ) {
    super();
    const { islands } = options;
    const controllerMap = this.#controllersByElement;
    const interpolator = this.#interpolator;
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

    const rootController = new IslandController(root);
    rootController.scope = options.scope;
    controllerMap.set(root, new AwaitedValue(rootController));
    controllerMap.cascade(root);

    this.zShow.onShow = async (el) => {
      if (this.isIsland(el) && !el.isHydrated) {
        await this.hydrateIsland(el);
        controllerMap.cascade(el);
        interpolator.ingest(el);
      }
    };

    this.zMap.onAppend = (el: Element, item: any, scopeKey: string) => {
      const existingControllerMaybe = controllerMap.get(el);
      const scope = existingControllerMaybe?.awaitedValue?.scope;
      const newController = new IslandController(el);
      const newScope = { ...scope };
      newScope[scopeKey] = item;
      newController.scope = newScope;
      controllerMap.set(el, new AwaitedValue(newController));
      controllerMap.cascade(el);
      interpolator.ingest(el);
    };

    this.zMap.onRemove = (el: Element) => {
      controllerMap.deleteTree(el);
    };

    // TODO unsubscribe
    this.#customElementConnectedObservable.subscribe((el) => {
      controllerMap.cascade(el);
      interpolator.ingest(el);
    });
  }

  ready() {
    return documentReady();
  }

  createCustomElementConstructor(island: Island): CustomElementConstructor {
    const { zShow } = this;
    const controllerMap = this.#controllersByElement;
    return createIslandElementConstructor(
      island,
      controllerMap,
      isShowing,
      this.#customElementConnectedObservable
    );

    function isShowing(el: HTMLElement) {
      const hasDirective = zShow.hasDirective(el);
      if (hasDirective) {
        const scope = controllerMap.getScopeFor(el);
        if (scope) {
          return zShow.shouldShow(el, scope);
        } else {
          return false;
        }
      }
      return true;
    }
  }

  update() {
    const { root } = this;
    const controllerMap = this.#controllersByElement;

    for (const maybeController of controllerMap.values()) {
      const controller = maybeController.awaitedValue;
      if (controller !== undefined) {
        this.#controllers.add(controller);
      }
    }

    for (const controller of this.#controllers) {
      const controllerProps = controller.props;
      const rootElement = controller.root;
      const outerScope = controllerMap.getScopeFor(rootElement.parentNode!);
      for (const name in controllerProps) {
        const value = rootElement.getAttribute(name)!;
        invariant(value !== null, `No attribute for prop ${name}`);
        controllerProps[name] = this.evaluate(outerScope, value);
      }
      controller.updateScope(controllerProps);
    }

    this.zShow.updateAllInstances(root, controllerMap);
    this.zClick.updateAllInstances(root, controllerMap);
    this.zMap.updateAllInstances(root, controllerMap);

    this.#interpolator.interpolate();
  }
  isIsland(el: HTMLElement): el is IslandElement {
    return this.#islandTagNames.includes(el.tagName);
  }
  hydrateIsland(el: IslandElement) {
    return el.render();
  }
}
