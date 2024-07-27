import htmx from "htmx.org";
import { AttributeDirective } from "./AttributeDirective";

export class ShowDirective extends AttributeDirective {
  constructor(
    attrName: string,
    readonly flagAttrName = `${attrName}-flag`
  ) {
    super(attrName);
  }
  update(el: HTMLElement, scope: any): void {
    const shouldShow = this.shouldShow(el, scope);
    const wasShowing = this.wasShowing(el);
    if (shouldShow !== wasShowing) {
      this.show(el, shouldShow);
    }
    if (shouldShow && !wasShowing) {
      this.onShow(el);
    }
  }
  onShow = (_el: HTMLElement) => {};
  show(el: HTMLElement, value: boolean) {
    el.toggleAttribute(this.flagAttrName, !value);
    if (value) {
      htmx.removeClass(el, "vh");
    } else {
      htmx.addClass(el, "vh");
    }
  }
  shouldShow(el: HTMLElement, scope: any) {
    const attrValue = this.getAttrValue(el);
    return !!this.evaluate(scope, attrValue);
  }
  wasShowing(el: HTMLElement) {
    return !el.hasAttribute(this.flagAttrName);
  }
}

export class HideDirective extends ShowDirective {
  evaluate(scope: any, expression: string) {
    return !super.evaluate(scope, expression);
  }
}
