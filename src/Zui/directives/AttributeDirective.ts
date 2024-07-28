import { invariant } from "../../Error";
import { Evaluator } from "../Evaluator";
import { ControllersByNodeMap } from "../collections";
import { selectHTMLElements } from "../util";

export abstract class AttributeDirective extends Evaluator {
  constructor(readonly attrName: string) {
    super();
  }
  get selector() {
    return `[${this.attrName}]`;
  }
  #queryResults = [] as HTMLElement[];
  query(el: HTMLElement): HTMLElement[] {
    const nodes = el.querySelectorAll(this.selector);
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
  updateAllInstances(el: HTMLElement, controllerMap: ControllersByNodeMap) {
    const queryResults = this.query(el);
    for (const nodeWithDirective of queryResults) {
      if (nodeWithDirective.parentNode) {
        /**
         * Controllers provide scope for the descendants of the top-level island element,
         * but not the top-level element itself. Said another way, the
         * scope for any element is determined by its anscestors, if they exists.
         */
        const scope = controllerMap.getScopeFor(nodeWithDirective.parentNode);
        if (scope) {
          this.update(nodeWithDirective, scope);
        }
      }
    }
  }
  abstract update(el: HTMLElement, scope?: any): void;
}
