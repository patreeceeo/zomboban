import htmx from "htmx.org";
import { Island, IslandController, IslandElement } from "Zui";
import { ControllersByNodeMap } from "Zui/collections";
import { AwaitedValue } from "../../Monad";
import { invariant } from "../../Error";

/**
 * @file this function is in its own file instead of in ../Island
 * because htmx uses Browser APIs at module load and therefor
 * cannot be loaded in Node.js, making the unit tests that depend On
 * ../Island abort.
 */

const resolvedPromise = Promise.resolve();
export function createIslandElementConstructor(
  island: Island,
  controllerMap: ControllersByNodeMap,
  isShowing: (el: HTMLElement) => boolean,
  promises: Promise<any>[]
): CustomElementConstructor {
  return class extends HTMLElement implements IslandElement {
    isHydrated = false;
    async connectedCallback() {
      const { templateHref } = island;

      this.setAttribute("template", templateHref);

      if (isShowing(this)) {
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

      promises.push(templatePromise, mountPromise);

      await mountPromise;
      await templatePromise;
      this.isHydrated = true;
    }
  };
}
