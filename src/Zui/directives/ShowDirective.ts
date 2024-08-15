import { hideElementEvent, showElementEvent } from "../events";
import { AttributeDirective } from ".";

export class ShowDirective extends AttributeDirective {
  constructor(
    attrName: string,
    readonly flagAttrName = `${attrName}-flag`
  ) {
    super(attrName);
  }
  start(el: Element, scope?: any): void {
    const shouldShow = this.shouldShow(el, scope);
    // TODO this covers a condition that is currently not being tested.
    this.show(el, shouldShow);
    if (shouldShow) {
      showElementEvent.trigger(el);
    }
    if (!shouldShow) {
      hideElementEvent.trigger(el);
    }
  }
  update(el: Element, scope: any): void {
    const shouldShow = this.shouldShow(el, scope);
    const wasShowing = this.wasShowing(el);
    if (shouldShow !== wasShowing) {
      this.show(el, shouldShow);
    }
    if (shouldShow && !wasShowing) {
      showElementEvent.trigger(el);
    }
    if (!shouldShow && wasShowing) {
      hideElementEvent.trigger(el);
    }
  }
  show(el: Element, value: boolean) {
    el.toggleAttribute(this.flagAttrName, !value);
    if (value) {
      el.classList.remove("vh");
    } else {
      el.classList.add("vh");
    }
  }
  shouldShow(el: Element, scope: any) {
    const attrValue = this.getAttrValue(el);
    return this.coerceToBoolean(this.evaluate(scope, attrValue));
  }
  wasShowing(el: Element) {
    return !el.hasAttribute(this.flagAttrName);
  }
}

export class HideDirective extends ShowDirective {
  evaluate(scope: any, expression: string) {
    return !super.evaluate(scope, expression);
  }
}
