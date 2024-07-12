export class RequestIndicator {
  constructor(readonly element: HTMLElement) {}
  show() {
    const { style } = this.element;
    style.display = "block";
    style.opacity = "1";
  }
  reset() {
    const { style } = this.element;
    style.display = "";
    style.opacity = "";
  }
}
