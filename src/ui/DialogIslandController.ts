import { withHMR } from "Zui/HMR";
import { IslandController } from "Zui/Island";
import {
  hideElementEvent,
  hmrSetIslandController,
  showElementEvent
} from "Zui/events";
import { hmrReloadTemplateEvent } from "./events";

class DialogIslandController extends IslandController {
  #dialog: HTMLDialogElement;
  constructor(root: HTMLElement) {
    super(root);
    this.#dialog = root.querySelector("dialog")!;
    showElementEvent.receiveOn(root, this.openSafely);
    hideElementEvent.receiveOn(root, (event: Event) => {
      if (event.target !== this.root) return;
      this.#dialog.close();
    });
    hmrSetIslandController.receiveOn(root, this.openSafely);
    hmrReloadTemplateEvent.receiveOn(root, this.openSafely);
  }

  openSafely = (event: Event) => {
    if (event.target !== this.root) return;
    let dialog = this.#dialog;
    if (!dialog.isConnected) {
      dialog = this.#dialog = this.root.querySelector("dialog")!;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
  };
}

let defaultExport = DialogIslandController;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<DialogIslandController>;
  import.meta.hot.accept(accept);
}

export default defaultExport;
