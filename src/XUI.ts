import htmx from "htmx.org";
import { invariant } from "./Error";
import { Island, IslandController } from "./Island";
import { InstanceMap } from "./collections";

function getBooleanAttribute(el: HTMLElement, attrName: string) {
  const value = el.getAttribute(attrName);
  return value === "true" || value === null;
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
    return getBooleanAttribute(el, "x-show-computed");
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

export class XUI {
  #islandInstances = new InstanceMap<typeof IslandController>();
  #islandsByRootElement = new Map<HTMLElement, typeof IslandController>();
  #islandNames: string[];
  #islandsSelector: string;
  constructor(
    readonly root: HTMLElement,
    readonly islands: Record<string, Island>
  ) {
    this.#islandNames = Array.from(Object.keys(islands));
    this.#islandsSelector = this.#islandNames.join(", ");
    xShow.onShow = (el) => {
      if (this.isIsland(el)) {
        this.hydrateIsland(el);
      }
    };
  }

  update(state: any) {
    xShow.update(this.root, state);
  }
  isIsland(el: HTMLElement) {
    return this.#islandNames.includes(el.tagName);
  }
  *findIslands(el: HTMLElement) {
    const elements = htmx.findAll(el, this.#islandsSelector);
    for (const el of elements) {
      if (el instanceof HTMLElement) {
        yield el;
      }
    }
  }
  async hydrateIsland(islandRootElement: HTMLElement) {
    invariant(
      islandRootElement instanceof HTMLElement,
      "expected element to be an HTMLElement"
    );
    const islandRootElementHasController =
      this.#islandsByRootElement.has(islandRootElement);

    const isShowing = xShow.wasShowing(islandRootElement);

    if (!islandRootElementHasController && isShowing) {
      const islandName = islandRootElement.tagName;
      const island = this.islands[islandName];
      const { templateHref } = island;
      const ControllerKlass = await island.loadControllerKlass();

      invariant(
        typeof ControllerKlass === "function",
        "Expected default export to be a function"
      );
      islandRootElement.setAttribute("template", templateHref);
      await htmx.ajax("get", templateHref, islandRootElement);
      const islandController = new ControllerKlass(islandRootElement);
      this.#islandInstances.add(islandController);
      this.#islandsByRootElement.set(islandRootElement, ControllerKlass);
    }
  }
}
