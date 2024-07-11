import { BASE_URL } from "../constants";
import { Modal } from "./Modal";
import { joinPath } from "../util";

const defaultCallback = (response: Response, data: FormData) => {
  void data;
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

    this.inputs = [...form.querySelectorAll("input")];
    this.inputs.forEach((input) => {
      input.onkeydown = (e) => {
        e.stopPropagation();
      };
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const items = [];
      for (const [key, value] of formData.entries()) {
        items.push(`${key}=${encodeURIComponent(value.toString())}`);
      }

      const actionPath = new URL(form.action).pathname;
      const response = await fetch(joinPath(BASE_URL, actionPath), {
        method: "POST",
        body: items.join("&"),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      this.inputs.forEach((input) => {
        input.value = "";
      });

      this.options.callback(response, formData);
    };
  }

  open() {
    super.open();
    this.inputs[0].focus();
  }
}
