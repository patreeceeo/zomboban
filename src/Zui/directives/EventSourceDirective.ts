import { delegateEventType } from "../events";
import { invariant } from "../../Error";
import { AttributeDirective } from "./AttributeDirective";

export class EventSourceDirective extends AttributeDirective {
  constructor(
    attrName: string,
    readonly eventName: string
  ) {
    super(attrName);
  }
  start(root: Element, scope: any) {
    root.addEventListener(
      this.eventName,
      (event: Event) => this.handleEvent(event, root, scope),
      { capture: true }
    );
  }
  handleEvent(event: Event, root: Element, scope: any) {
    event.preventDefault();
    const methodName = this.getAttrValue(root);
    const method = this.evaluate(scope, methodName, false);
    if (typeof method === "function") {
      method(event);
    } else {
      invariant(
        method === undefined,
        `Expected value to refer to a function, if anything`
      );
      delegateEventType.map(event, methodName);
    }
  }
}
