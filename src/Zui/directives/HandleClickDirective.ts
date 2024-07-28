import { ObservableMap } from "../../Observable";
import { AttributeDirective } from "./AttributeDirective";

export class HandleClickDirective extends AttributeDirective {
  #handlerMap = new ObservableMap<HTMLElement, EventListener>();
  #handleSet = ([el, listener]: [HTMLElement, EventListener]) => {
    el.addEventListener("click", listener);
  };
  #handleDelete = ([el, listener]: [HTMLElement, EventListener]) => {
    el.removeEventListener("click", listener);
  };
  constructor(attrName: string) {
    super(attrName);
    const handlerMap = this.#handlerMap;
    handlerMap.onSet(this.#handleSet);
    handlerMap.onDelete(this.#handleDelete);
  }
  update(el: HTMLElement, scope: any): void {
    const attrValue = this.getAttrValue(el);
    const handler = this.evaluate(scope, attrValue);
    this.#handlerMap.set(el, handler);
  }
}
