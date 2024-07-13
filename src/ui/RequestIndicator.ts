import { Modal } from "./Modal";

export class RequestIndicator extends Modal {
  #messageElement = this.element.querySelector(".message");
  #requestCount = 0;
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
    this.#messageElement!.innerHTML = value;
  }
}
