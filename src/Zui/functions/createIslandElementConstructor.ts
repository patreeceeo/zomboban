import htmx from "htmx.org";
import { Island, IslandController, IslandElement } from "../Island";
import { ControllersByNodeMap } from "../collections";
import { AwaitedValue } from "../../Monad";
import { invariant } from "../../Error";
import { Observable } from "../../Observable";
import { BASE_URL } from "../../constants";

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
    isHydrated = false;
    async connectedCallback() {
      const { templateHref } = island;

      this.setAttribute("template", templateHref);

      if (isShowing(this)) {
        await this.render();
      }
    }

    async hydrate() {
      controllerMap.set(this, new AwaitedValue());
      controllerMap.cascade(this);
      const Clazz = await island.loadController();
      invariant(
        typeof Clazz === "function",
        "Expected result from loadController be a constructor"
      );
      const controller = new Clazz(this);
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
        `${BASE_URL}${templateHref}`,
        this
      );

      let hydratePromise = this.hydrate();

      await Promise.all([hydratePromise, templatePromise]);
      observable.next(this);
      this.isHydrated = true;
    }
  };
}
