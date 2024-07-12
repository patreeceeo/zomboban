import { Modal } from "./Modal";

export class RequestIndicator extends Modal {
  #messageElement = this.element.querySelector(".message");
  set message(value: string) {
    this.#messageElement!.innerHTML = value;
  }
}
