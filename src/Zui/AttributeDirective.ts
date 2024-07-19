import htmx from "htmx.org";
import { invariant } from "../Error";
import { AwaitedController, ControllersByElementMap } from "Zui";

export abstract class AttributeDirective {
  constructor(readonly attrName: string) {}
  get selector() {
    return `[${this.attrName}]`;
  }
  isHTMLElement = (el: Element): el is HTMLElement => el instanceof HTMLElement;
  query(el: HTMLElement): HTMLElement[] {
    return Array.from(htmx.findAll(el, this.selector)).filter(
      this.isHTMLElement
    );
  }
  hasDirective(el: HTMLElement) {
    return el.hasAttribute(this.attrName);
  }
  /**
   * Controllers control and provide scope for the descendants of the top-level
   * island element, but not the top-level element itself. Said another way, the
   * controller for any element, if it exists, is determined by one its anscestors.
   */
  getMaybeController(
    startEl: HTMLElement,
    controllerMap: ControllersByElementMap
  ) {
    let el = startEl as Element | null;
    let maybeController: AwaitedController | undefined;

    while (maybeController === undefined && el !== null) {
      el = el.parentElement;
      if (el instanceof HTMLElement) {
        maybeController = controllerMap.get(el);
      }
    }
    return maybeController;
  }
  getScope(maybeController: AwaitedController | undefined, state: any) {
    const controller = maybeController?.awaitedValue;
    return controller?.scope ?? state;
  }
  getScopeAt(scope: any, key: string) {
    invariant(key in scope, `'${key}' is not in scope`);
    return scope[key];
  }
  getAttrValue(el: HTMLElement, attrName = this.attrName) {
    const attrValue = el.getAttribute(attrName);
    invariant(attrValue !== null, `${this.attrName} must have a value`);
    return attrValue;
  }
  updateAllInstances(
    el: HTMLElement,
    controllerMap: ControllersByElementMap,
    state: any
  ) {
    const queryResults = this.query(el);
    for (const el of queryResults) {
      const maybeController = this.getMaybeController(el, controllerMap);
      if (
        maybeController === undefined ||
        maybeController.awaitedValue !== undefined
      ) {
        const scope = this.getScope(maybeController, state);
        this.update(el, scope);
      }
    }
  }
  abstract update(el: HTMLElement, scope?: any): void;
}
