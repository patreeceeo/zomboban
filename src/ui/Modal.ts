import { invariant } from "../Error";

export class Modal {
  constructor(readonly element: HTMLDialogElement) {
    const cancelButton = this.element.querySelector(
      "button[type=cancel]"
    ) as HTMLButtonElement;

    invariant(cancelButton !== undefined, "Modals must have a cancel button");

    cancelButton.onclick = () => {
      this.element.close();
    };
  }

  open() {
    this.element.showModal();
  }

  close() {
    this.element.close();
  }
}
