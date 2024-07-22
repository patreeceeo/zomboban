import htmx from "htmx.org";
import { invariant } from "../Error";
import { Base } from "./Base";
import { ControllersByNodeMap } from "./collections";
import { selectHTMLElements } from "./util";

export abstract class AttributeDirective extends Base {
  constructor(readonly attrName: string) {
    super();
  }
  get selector() {
    return `[${this.attrName}]`;
  }
  #queryResults = [] as HTMLElement[];
  query(el: HTMLElement): HTMLElement[] {
    const nodes = htmx.findAll(el, this.selector);
    this.#queryResults.length = 0;
    return selectHTMLElements(nodes, this.#queryResults);
  }
  hasDirective(el: HTMLElement) {
    return el.hasAttribute(this.attrName);
  }
  getAttrValue(el: HTMLElement, attrName = this.attrName) {
    // TODO(perf): getting attributes from the DOM is medium expensive. Memoize?
    const attrValue = el.getAttribute(attrName);
    invariant(attrValue !== null, `${this.attrName} must have a value`);
    return attrValue;
  }
  updateAllInstances(
    el: HTMLElement,
    controllerMap: ControllersByNodeMap,
    state: any
  ) {
    const queryResults = this.query(el);
    for (const el of queryResults) {
      let scope = state;
      if (el.parentNode) {
        /**
         * Controllers provide scope for the descendants of the top-level island element,
         * but not the top-level element itself. Said another way, the
         * scope for any element is determined by its anscestors, if they exists.
         */
        scope = this.getScope(el.parentNode, controllerMap, state);
      }
      this.update(el, scope);
    }
  }
  abstract update(el: HTMLElement, scope?: any): void;
}
