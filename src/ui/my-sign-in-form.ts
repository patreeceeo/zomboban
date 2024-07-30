import { IslandController } from "../Zui/Island";
import { withHMR } from "../Zui/HMR";
import { signInEvent } from "./events";

class Scope {
  constructor(readonly root: HTMLDialogElement) {}
  cancel() {
    this.root.close();
  }
}

class Props {}

export class SignInFormController extends IslandController<Scope, Props> {
  #dialog: HTMLDialogElement;

  scope = new Scope(this.root as HTMLDialogElement);
  props = new Props();

  constructor(root: HTMLElement) {
    super(root);
    const form = root.querySelector("form")!;

    this.#dialog = root.querySelector("dialog")!;

    const inputs = form.querySelectorAll(
      "input[type=text], input[type=password]"
    ) as Iterable<HTMLInputElement>;

    for (const input of inputs) {
      input.onkeydown = (e) => {
        e.stopPropagation();
      };
    }

    form.addEventListener("submit", () => {
      for (const input of inputs) {
        if (input.type === "text") {
          input.focus();
        }
        input.value = "";
      }
    });

    form.addEventListener("htmx:afterRequest", this.handleAfterRequest as any);
  }

  handleAfterRequest = ({ detail }: CustomEvent<HtmxRequestDetails>) => {
    if (detail.successful) {
      this.close();
      signInEvent.trigger(this.root);
    }
  };

  open() {
    this.#dialog.showModal();
  }

  close() {
    this.#dialog.close();
  }

  unmount() {}
}

let defaultExport = SignInFormController;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<SignInFormController>;
  import.meta.hot.accept(accept);
}

export default defaultExport;
