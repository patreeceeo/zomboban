import htmx from "htmx.org";

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
  updateAllInstances(el: HTMLElement, state: any) {
    const queryResults = this.query(el);
    for (const el of queryResults) {
      this.update(el, state);
    }
  }
  abstract update(el: HTMLElement, state: any): void;
}
