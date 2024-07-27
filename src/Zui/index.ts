import { Island, IslandController, IslandElement } from "./Island";
import { HideDirective, ShowDirective } from "./ShowDirective";
import { HandleClickDirective } from "./HandleClickDirective";
import { Evaluator } from "./Evaluator";
import { ControllersByNodeMap } from "./collections";
import { Interpolator } from "./Interpolator";
import { createIslandElementConstructor } from "./functions/createIslandElementConstructor";
import { MapDirective } from "./MapDirective";
import { AwaitedValue } from "../Monad";
import { Observable } from "../Observable";
import { invariant } from "../Error";
import { hmrDeleteIslandController, hmrSetIslandController } from "./events";
import { ImageSrcDirective } from "./ImageSrcDirective";
import { SingletonMap } from "../collections/InstanceMap";

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
  #controllers = new Set<AwaitedValue<IslandController>>();
  #customElementConnectedObservable = new Observable<Element>();
  #interpolator = new Interpolator(this.#controllersByElement);
  directives = new SingletonMap();
  constructor(
    readonly root: HTMLElement,
    readonly options: ZuiOptions
  ) {
    super();
    const { islands } = options;
    const controllerMap = this.#controllersByElement;
    const controllers = this.#controllers;
    const interpolator = this.#interpolator;
    const { directives } = this;

    directives.add(
      new ShowDirective("z-show"),
      new HideDirective("z-hide"),
      new HandleClickDirective("z-click"),
      new MapDirective("z-map"),
      new ImageSrcDirective("z-src")
    );

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

    controllerMap.onSet(([_, maybe]) => {
      controllers.add(maybe);
    });
    controllerMap.onDelete(([rootEl, maybe]) => {
      if (rootEl === maybe.awaitedValue?.root) {
        controllers.delete(maybe);
      }
    });

    const rootController = new IslandController(root);
    rootController.scope = options.scope;
    controllerMap.set(root, new AwaitedValue(rootController));
    controllerMap.cascade(root);

    interpolator.ingest(root);

    this.directives.get(ShowDirective)!.onShow = this.handleShowElement;
    this.directives.get(HideDirective)!.onShow = this.handleShowElement;

    const zMap = this.directives.get(MapDirective)!;
    zMap.onAppend = (el: Element, item: any, scopeKey: string) => {
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

    zMap.onRemove = (el: Element) => {
      controllerMap.deleteTree(el);
    };

    // TODO unsubscribe
    this.#customElementConnectedObservable.subscribe((el) => {
      controllerMap.cascade(el);
      interpolator.ingest(el);
    });

    hmrDeleteIslandController.receiveOn(root, (event) => {
      const controllerRoot = event.target;
      invariant(controllerRoot instanceof Node, `Expected a DOM Node`);
      controllerMap.deleteTree(controllerRoot);
    });

    hmrSetIslandController.receiveOn(root, (event: CustomEvent) => {
      const controllerRoot = event.target;
      invariant(controllerRoot instanceof Node, `Expected a DOM Node`);
      const controller = event.detail as IslandController;
      controllerMap.set(controllerRoot, new AwaitedValue(controller));
      controllerMap.cascade(controllerRoot);
    });
  }

  handleShowElement = async (el: HTMLElement) => {
    if (this.isIsland(el) && !el.isHydrated) {
      await this.hydrateIsland(el);
      this.#controllersByElement.cascade(el);
      this.#interpolator.ingest(el);
    }
  };

  ready() {
    return documentReady();
  }

  createCustomElementConstructor(island: Island): CustomElementConstructor {
    const zShow = this.directives.get(ShowDirective)!;
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

    for (const { awaitedValue } of this.#controllers) {
      if (awaitedValue !== undefined) {
        const controllerProps = awaitedValue.props;
        const rootElement = awaitedValue.root;
        const outerScope = controllerMap.getScopeFor(rootElement.parentNode!);
        for (const name in controllerProps) {
          const value = rootElement.getAttribute(name)!;
          invariant(value !== null, `No attribute for prop ${name}`);
          controllerProps[name] = this.evaluate(outerScope, value);
        }
        awaitedValue.updateScope(controllerProps);
      }
    }

    for (const directive of this.directives.values()) {
      directive.updateAllInstances(root, controllerMap);
    }

    this.#interpolator.interpolate();
  }
  isIsland(el: HTMLElement): el is IslandElement {
    return this.#islandTagNames.includes(el.tagName);
  }
  hydrateIsland(el: IslandElement) {
    return el.render();
  }
}
