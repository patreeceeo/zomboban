import htmx from "htmx.org";
import { Island, IslandController, IslandElement } from "../Island";
import { ControllersByNodeMap } from "../collections";
import { AwaitedValue } from "../../Monad";
import { invariant } from "../../Error";
import { Observable } from "../../Observable";
import { BASE_URL } from "../../constants";
import { joinPath } from "../../util";

/**
 * @file this function is in its own file instead of in ../Island
 * because htmx uses Browser APIs at module load and therefor
 * cannot be loaded in Node.js, making the unit tests that depend On
 * ../Island abort.
 */

export function createIslandElementConstructor(
  island: Island,
  controllerMap: ControllersByNodeMap,
  isShowing: (el: HTMLElement) => boolean,
  observable: Observable<Element>
): CustomElementConstructor {
  return class extends HTMLElement implements IslandElement {
    #controller: IslandController | undefined;

    isHydrated = false;
    async connectedCallback() {
      const { templateHref } = island;

      this.setAttribute("template", templateHref);

      if (isShowing(this)) {
        await this.render();
      }
    }

    disconnectedCallback() {
      const maybeController = controllerMap.get(this);
      maybeController?.awaitedValue?.unmount();
      controllerMap.deleteTree(this);
    }

    async hydrate() {
      controllerMap.set(this, new AwaitedValue());
      controllerMap.cascade(this);
      const Clazz = await island.loadController();
      invariant(
        typeof Clazz === "function",
        "Expected result from loadController be a constructor"
      );
      const controller = (this.#controller = new Clazz(this));
      invariant(
        controller instanceof IslandController,
        `Expected default export to be a subclass of ${IslandController.name}`
      );
      controllerMap.get(this)!.awaitedValue = controller;
    }

    async render() {
      const { templateHref } = island;
      const templatePromise = htmx.ajax(
        "get",
        joinPath(BASE_URL, templateHref),
        this
      );

      let hydratePromise = this.hydrate();

      await Promise.all([hydratePromise, templatePromise]);
      observable.next(this);
      this.isHydrated = true;
    }

    get controller() {
      invariant(
        this.isHydrated,
        `Tried to get my controller before I was hydrated`
      );
      return this.#controller!;
    }
  };
}
