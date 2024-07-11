import { Modal } from "./Modal";

const defaultCallback = (response: HtmxRequestDetails) => {
  void response;
};

export class SignInFormOptions {
  constructor(readonly callback = defaultCallback) {}
}

const defaultOptions = new SignInFormOptions();

export class SignInForm extends Modal {
  inputs = [] as HTMLInputElement[];
  constructor(
    readonly element: HTMLDialogElement,
    readonly options = defaultOptions
  ) {
    super(element);
    const form =
      element instanceof HTMLFormElement
        ? element
        : element.querySelector("form")!;

    this.inputs = [
      ...form.querySelectorAll("input:not([type=button]):not([type=submit])")
    ] as HTMLInputElement[];
    this.inputs.forEach((input) => {
      input.onkeydown = (e) => {
        e.stopPropagation();
      };
    });
    form.addEventListener("htmx:responseError", ((
      event: CustomEvent<HtmxRequestDetails>
    ) => {
      var responseText = event.detail.xhr.responseText;
      var target = event.detail.target;

      // Swap the response text into the target element
      if (target) {
        target.innerHTML = responseText;
      }
    }) as any);

    form.addEventListener("htmx:afterRequest", this.handleAfterRequest as any);
  }

  handleAfterRequest = (e: CustomEvent<HtmxRequestDetails>) => {
    this.options.callback(e.detail);
  };

  open() {
    this.inputs.forEach((input) => {
      input.value = "";
    });

    super.open();
  }
}
