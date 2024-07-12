export class Modal {
  constructor(readonly element: HTMLDialogElement) {
    const cancelButton = this.element.querySelector(
      "input[name=cancel]"
    ) as HTMLButtonElement;

    if (cancelButton) {
      cancelButton.onclick = () => {
        this.element.close();
      };
    }
  }

  open() {
    this.element.showModal();
  }

  close() {
    this.element.close();
  }
}
