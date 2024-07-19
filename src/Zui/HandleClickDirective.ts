import { ObservableMap } from "../Observable";
import { AttributeDirective } from "./AttributeDirective";

type Handler = Parameters<HTMLElement["addEventListener"]>[1];

export class HandleClickDirective extends AttributeDirective {
  #handlerMap = new ObservableMap<HTMLElement, Handler>();
  #handleSet = ([el, handler]: [HTMLElement, Handler]) => {
    el.addEventListener("click", handler);
  };
  #handleDelete = ([el, handler]: [HTMLElement, Handler]) => {
    el.removeEventListener("click", handler);
  };
  constructor(attrName: string) {
    super(attrName);
    const handlerMap = this.#handlerMap;
    handlerMap.onSet(this.#handleSet);
    handlerMap.onDelete(this.#handleDelete);
  }
  update(el: HTMLElement, scope: any): void {
    const attrValue = this.getAttrValue(el);
    const handler = this.getScopeAt(scope, attrValue);
    this.#handlerMap.set(el, handler);
  }
}
