import htmx from "htmx.org";
import { AttributeDirective } from "./AttributeDirective";

function getBooleanAttribute(
  el: HTMLElement,
  attrName: string,
  defaultValue: boolean
) {
  const value = el.getAttribute(attrName);
  return value !== null ? value === "true" : defaultValue;
}

function setBooleanAttribute(
  el: HTMLElement,
  attrName: string,
  value: boolean
) {
  el.setAttribute(attrName, String(value));
}

export class ShowDirective extends AttributeDirective {
  attrNameComputed = `${this.attrName}-computed`;
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
    setBooleanAttribute(el, this.attrNameComputed, value);
    if (value) {
      htmx.removeClass(el, "vh");
    } else {
      htmx.addClass(el, "vh");
    }
  }
  shouldShow(el: HTMLElement, scope: any) {
    const attrValue = this.getAttrValue(el);
    return !!this.getScopeAt(scope, attrValue);
  }
  wasShowing(el: HTMLElement) {
    return getBooleanAttribute(el, this.attrNameComputed, true);
  }
}
