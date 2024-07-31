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
    showElementEvent.receiveOn(root, this.open);
    hideElementEvent.receiveOn(root, () => {
      this.#dialog.close();
    });
    hmrSetIslandController.receiveOn(root, this.open);
    hmrReloadTemplateEvent.receiveOn(root, this.open);
  }

  open = () => {
    let dialog: HTMLDialogElement;
    // Dialog elements are just weird?
    if (!this.#dialog.isConnected) {
      this.#dialog.close();
      dialog = this.#dialog = this.root.querySelector("dialog")!;
    } else {
      dialog = this.#dialog;
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
