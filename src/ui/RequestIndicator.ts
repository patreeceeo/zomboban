import { invariant } from "../Error";
import { Modal } from "./Modal";

export class RequestIndicator extends Modal {
  #messageNode: Text;
  #requestCount = 0;
  constructor(element: HTMLDialogElement) {
    super(element);
    const parent = element.querySelector(".message")!;
    const { firstChild } = parent;
    invariant(
      firstChild !== null && firstChild.nodeType === Node.TEXT_NODE,
      `Expected a text node inside .message`
    );
    this.#messageNode = firstChild as Text;
  }
  set requestCount(n: number) {
    this.#requestCount = n;
    if (this.#requestCount <= 0) {
      this.close();
    } else {
      this.open();
    }
  }
  get requestCount() {
    return this.#requestCount;
  }
  set message(value: string) {
    this.#messageNode.textContent = value;
  }
}
