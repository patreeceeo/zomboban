import { Island, IslandController, IslandElement } from "./Island";
import { Evaluator } from "./Evaluator";
import { ControllersByNodeMap } from "./collections";
import { AttrNodeInterpolator, TextNodeInterpolator } from "./Interpolator";
import { createIslandElementConstructor } from "./functions/createIslandElementConstructor";
import { AwaitedValue } from "../Monad";
import { Observable } from "../Observable";
import { invariant } from "../Error";
import {
  hmrDeleteIslandController,
  hmrSetIslandController,
  showElementEvent
} from "./events";
import { InstanceMap } from "../collections/InstanceMap";
import {
  ShowDirective,
  HideDirective,
  EventSourceDirective,
  ImageSrcDirective,
  MapDirective,
  AttributeDirective,
  ClassListDirective
} from "./directives";
import { RouteDirective } from "./directives/RouteDirective";

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
  #textInterpolator = new TextNodeInterpolator(this.#controllersByElement);
  #attrInterpolator = new AttrNodeInterpolator(this.#controllersByElement);
  directives = new InstanceMap<typeof AttributeDirective>();
  constructor(
    readonly root: HTMLElement,
    readonly options: ZuiOptions
  ) {
    super();
    const { islands } = options;
    const controllerMap = this.#controllersByElement;
    const controllers = this.#controllers;
    const textInterpolator = this.#textInterpolator;
    const attrInterpolator = this.#attrInterpolator;
    const { directives } = this;

    directives.add(
      new ShowDirective("z-show"),
      new HideDirective("z-hide"),
      new EventSourceDirective("z-click", "click"),
      new EventSourceDirective("z-change", "change"),
      new MapDirective("z-map"),
      new ImageSrcDirective("z-src"),
      new ClassListDirective("z-class"),
      // TODO change API so that users add directives that way Zui doesn't need to be aware of the type of options.scope
      new RouteDirective("z-route", options.scope.defaultRoute)
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

    textInterpolator.ingest(root);
    attrInterpolator.ingest(root);

    showElementEvent.receiveOn(root, this.handleShowElement);

    const zMaps = this.directives.getAll(MapDirective)!;

    for (const zMap of zMaps) {
      zMap.onAppend = (el: Element, item: any, scopeKey: string) => {
        const existingControllerMaybe = controllerMap.get(el);
        const scope = existingControllerMaybe?.awaitedValue?.scope;
        const newController = new IslandController(el);
        const newScope = { ...scope };
        newScope[scopeKey] = item;
        newController.scope = newScope;
        controllerMap.set(el, new AwaitedValue(newController));
        controllerMap.cascade(el);
        textInterpolator.ingest(el);
        attrInterpolator.ingest(el);
      };

      zMap.onRemove = (el: Element) => {
        controllerMap.deleteTree(el);
        textInterpolator.expell(el);
        attrInterpolator.expell(el);
      };
    }

    // TODO unsubscribe
    this.#customElementConnectedObservable.subscribe((el) => {
      controllerMap.cascade(el);
      textInterpolator.ingest(el);
      attrInterpolator.ingest(el);
      for (const directiveSet of this.directives.values()) {
        for (const directive of directiveSet) {
          directive.startAllInstances(el, controllerMap);
        }
      }
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

    for (const directiveSet of this.directives.values()) {
      for (const directive of directiveSet) {
        directive.startAllInstances(root, controllerMap);
      }
    }

    root.classList.add("z-init");
  }

  handleShowElement = async (event: Event) => {
    const el = event.target as HTMLElement;
    if (this.isIsland(el) && !el.isHydrated && !el.isHydrating) {
      await this.hydrateIsland(el);
      this.#controllersByElement.cascade(el);
      this.#textInterpolator.ingest(el);
    }
  };

  ready() {
    return documentReady();
  }

  createCustomElementConstructor(island: Island): CustomElementConstructor {
    const zShows = this.directives.getAll(ShowDirective)!;
    const controllerMap = this.#controllersByElement;
    return createIslandElementConstructor(
      island,
      controllerMap,
      isShowing,
      this.#customElementConnectedObservable
    );

    function isShowing(el: HTMLElement) {
      for (const zShow of zShows) {
        const hasDirective = zShow.hasDirective(el);
        if (hasDirective) {
          const scope = controllerMap.getScopeFor(el);
          if (scope) {
            return zShow.shouldShow(el, scope);
          } else {
            return false;
          }
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
          if (value !== null) {
            controllerProps[name] = this.evaluate(outerScope, value);
          }
        }
        awaitedValue.updateScope(controllerProps);
      }
    }

    for (const directiveSet of this.directives.values()) {
      for (const directive of directiveSet) {
        directive.updateAllInstances(root, controllerMap);
      }
    }

    this.#textInterpolator.interpolate();
    this.#attrInterpolator.interpolate();
  }
  isIsland(el: HTMLElement): el is IslandElement {
    return this.#islandTagNames.includes(el.tagName);
  }
  hydrateIsland(el: IslandElement) {
    return el.render();
  }
}
