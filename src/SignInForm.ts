const defaultHandler = (response: Response, data: FormData) => {
  void data;
  void response;
};

export class SignInFormOptions {
  constructor(
    readonly onSuccessfulSignIn = defaultHandler,
    readonly onFailedSignIn = defaultHandler
  ) {}
}

const defaultOptions = new SignInFormOptions();

export class SignInForm {
  inputs = [] as HTMLInputElement[];
  constructor(
    readonly element: HTMLElement,
    readonly options = defaultOptions
  ) {
    const form =
      element instanceof HTMLFormElement
        ? element
        : element.querySelector("form")!;

    this.element.style.display = "none";

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

      const response = await fetch(form.action, {
        method: "POST",
        body: items.join("&"),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      this.inputs.forEach((input) => {
        input.value = "";
      });

      if (response.ok) {
        this.options.onSuccessfulSignIn(response, formData);
      } else {
        this.options.onFailedSignIn(response, formData);
      }
    };
  }

  show() {
    this.element.style.display = "initial";
  }

  hide() {
    this.element.style.display = "none";
  }
}
