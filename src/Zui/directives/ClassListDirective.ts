import { AttributeDirective } from ".";

export function updateClassList(el: Element, classMap: Record<string, any>) {
  const { classList } = el;
  for (const [key, value] of Object.entries(classMap)) {
    if (value) {
      classList.add(key);
    } else {
      classList.remove(key);
    }
  }
}

export class ClassListDirective extends AttributeDirective {
  update(el: HTMLElement, scope?: any): void {
    const attrValue = this.getAttrValue(el);
    const attrValueObject = JSON.parse(attrValue) as Record<string, any>;
    const classMap = {} as Record<string, any>;

    for (const [className, expression] of Object.entries(attrValueObject)) {
      const boolish = this.evaluate(scope, expression);
      classMap[className] = boolish;
    }

    updateClassList(el, classMap);
  }
}
