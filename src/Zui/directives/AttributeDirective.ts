import { invariant } from "../../Error";
import { Evaluator } from "../Evaluator";
import { ControllersByNodeMap } from "../collections";
import { selectElements } from "../util";

export class AttributeDirective extends Evaluator {
  constructor(readonly attrName: string) {
    super();
  }
  get selector() {
    return `[${this.attrName}]`;
  }
  #queryResults = [] as Element[];
  query(el: Element): Element[] {
    const nodes = el.querySelectorAll(this.selector);
    this.#queryResults.length = 0;
    return selectElements(nodes, this.#queryResults);
  }
  hasDirective(el: Element) {
    return el.hasAttribute(this.attrName);
  }
  getAttrValue(el: Element, attrName = this.attrName) {
    // TODO(perf): getting attributes from the DOM is medium expensive. Memoize?
    const attrValue = el.getAttribute(attrName);
    invariant(attrValue !== null, `${this.attrName} must have a value`);
    return attrValue;
  }
  startAllInstances(el: Element, controllerMap: ControllersByNodeMap) {
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
          this.start(nodeWithDirective, scope);
        }
      }
    }
  }
  updateAllInstances(el: Element, controllerMap: ControllersByNodeMap) {
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
  start(el: Element, scope?: any) {
    void el, scope;
  }
  update(el: Element, scope?: any) {
    void el, scope;
  }
}
